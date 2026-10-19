import { http, HttpResponse, server } from '@spotify-confidence/testing';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { createProjectDir, writeJsonFile } from '@spotify-confidence/testing/scaffold';
import { sqlCommand } from '@commands/data/sql.js';
import { captureOutput } from '../helpers/capture.js';
import { createRunner } from '../helpers/run-command.js';

const sut = createRunner(sqlCommand);
const base = 'https://metrics.eu.confidence.dev/v1';

function mockPreview(job = 'sqlJobs/preview-1') {
  server.use(http.post(`${base}/sqlQuery:preview`, () => HttpResponse.json({ job })));
}

it('executes an explicit preview once and returns its job reference', async () => {
  // Arrange
  using _auth = prepareAuthTokens('valid');
  using project = createProjectDir('empty');
  using output = captureOutput();
  const file = writeJsonFile(project.path, 'query.json', { query: 'SELECT 1' });
  const queries: unknown[] = [];
  server.use(
    http.post(`${base}/sqlQuery:preview`, async ({ request }) => {
      queries.push(await request.json());
      return HttpResponse.json({ job: 'sqlJobs/preview-1' });
    }),
  );

  // Act
  await sut(['sql', 'preview', '--from-file', file, '--json']);

  // Assert
  expect(queries).toEqual([{ query: 'SELECT 1' }]);
  expect(JSON.parse(output.stdout).data).toEqual({ job: 'sqlJobs/preview-1' });
});

it('inspects a failed job successfully without starting a new query', async () => {
  // Arrange
  using _auth = prepareAuthTokens('valid');
  using output = captureOutput();
  server.use(
    http.get(`${base}/sqlJobs/preview-1`, () =>
      HttpResponse.json({
        name: 'sqlJobs/preview-1',
        state: 'FAILED',
        failedQueryResult: { error: 'Permission denied', reason: 'PERMISSION' },
      }),
    ),
  );

  // Act
  await sut(['sql', 'status', '--name', 'sqlJobs/preview-1', '--json']);

  // Assert
  expect(JSON.parse(output.stdout).data.failedQueryResult.reason).toBe('PERMISSION');
  expect(output.stderr).toBe('');
});

it('waits through pending states until completion without replaying preview', async () => {
  // Arrange
  using _auth = prepareAuthTokens('valid');
  using project = createProjectDir('empty');
  using output = captureOutput();
  const file = writeJsonFile(project.path, 'query.json', { query: 'SELECT 1' });
  mockPreview();
  let reads = 0;
  server.use(
    http.get(`${base}/sqlJobs/preview-1`, () =>
      HttpResponse.json({
        name: 'sqlJobs/preview-1',
        state: reads++ === 0 ? 'PENDING_RETRY' : 'COMPLETED',
      }),
    ),
  );

  // Act
  await sut(['sql', 'preview', '--from-file', file, '--wait', '--timeout', '5', '--json']);

  // Assert
  expect(JSON.parse(output.stdout).data.state).toBe('COMPLETED');
  expect(reads).toBe(2);
});

it('reports terminal query errors when waiting', async () => {
  // Arrange
  using _auth = prepareAuthTokens('valid');
  using project = createProjectDir('empty');
  using output = captureOutput();
  const file = writeJsonFile(project.path, 'query.json', { query: 'SELECT 1' });
  mockPreview();
  server.use(
    http.get(`${base}/sqlJobs/preview-1`, () =>
      HttpResponse.json({
        name: 'sqlJobs/preview-1',
        state: 'FAILED',
        failedQueryResult: { error: 'Missing permissions' },
      }),
    ),
  );

  // Act
  await sut(['sql', 'preview', '--from-file', file, '--wait']);

  // Assert
  expect(output.stderr).toContain('Missing permissions');
  expect(output.stderr).toContain('sqlJobs/preview-1');
  expect(process.exitCode).toBe(1);
});

it('preserves the job reference on a bounded wait timeout', async () => {
  // Arrange
  using _auth = prepareAuthTokens('valid');
  using project = createProjectDir('empty');
  using output = captureOutput();
  const file = writeJsonFile(project.path, 'query.json', { query: 'SELECT 1' });
  mockPreview();
  server.use(
    http.get(`${base}/sqlJobs/preview-1`, () =>
      HttpResponse.json({
        name: 'sqlJobs/preview-1',
        state: 'THROTTLED',
      }),
    ),
  );

  // Act
  await sut(['sql', 'preview', '--from-file', file, '--wait', '--timeout', '0.05']);

  // Assert
  expect(output.stderr).toContain('timed out');
  expect(output.stderr).toContain('sqlJobs/preview-1');
  expect(process.exitCode).toBe(1);
});

it('validates dry-run input without authentication or API calls', async () => {
  // Arrange
  using _auth = prepareAuthTokens('none');
  using project = createProjectDir('empty');
  using output = captureOutput();
  const file = writeJsonFile(project.path, 'query.json', { query: 'SELECT 1' });

  // Act
  await sut(['sql', 'preview', '--from-file', file, '--dry-run', '--json']);

  // Assert
  expect(JSON.parse(output.stdout).data.dryRun).toBe(true);
  expect(output.stderr).toBe('');
});

it.each(['sqlJobs/../other', 'https://example.com/sqlJobs/a', 'sqlJobs/a%2fb', 'factTables/a'])(
  'rejects an invalid job name %s before network access',
  async (name) => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await sut(['sql', 'status', '--name', name, '--dry-run']);

    expect(output.stderr).toContain('Resource name');
    expect(process.exitCode).toBe(1);
  },
);

it('rejects unknown preview input instead of dropping fields', async () => {
  // Arrange
  using project = createProjectDir('empty');
  using output = captureOutput();
  const file = writeJsonFile(project.path, 'query.json', { query: 'SELECT 1', warehouse: 'other' });

  // Act
  await sut(['sql', 'preview', '--from-file', file, '--dry-run']);

  // Assert
  expect(output.stderr).toContain('accepts only');
  expect(process.exitCode).toBe(1);
});

it('reports a lost preview response as unknown without retrying', async () => {
  // Arrange
  using _auth = prepareAuthTokens('valid');
  using project = createProjectDir('empty');
  using output = captureOutput();
  const file = writeJsonFile(project.path, 'query.json', { query: 'SELECT 1' });
  let calls = 0;
  server.use(
    http.post(`${base}/sqlQuery:preview`, () => {
      calls++;
      return HttpResponse.error();
    }),
  );

  // Act
  await sut(['sql', 'preview', '--from-file', file, '--json']);

  // Assert
  expect(calls).toBe(1);
  expect(output.stderr).toContain('outcome is unknown');
  expect(process.exitCode).toBe(1);
});

it('does not start a preview without authentication', async () => {
  using _auth = prepareAuthTokens('none');
  using project = createProjectDir('empty');
  using output = captureOutput();
  const file = writeJsonFile(project.path, 'query.json', { query: 'SELECT 1' });

  await sut(['sql', 'preview', '--from-file', file]);

  expect(output.stderr).toContain('Not logged in');
  expect(process.exitCode).toBe(1);
});

it('reports malformed preview responses rather than following arbitrary URLs', async () => {
  // Arrange
  using _auth = prepareAuthTokens('valid');
  using project = createProjectDir('empty');
  using output = captureOutput();
  const file = writeJsonFile(project.path, 'query.json', { query: 'SELECT 1' });
  mockPreview('https://example.com/steal');

  // Act
  await sut(['sql', 'preview', '--from-file', file, '--wait']);

  // Assert
  expect(output.stderr).toContain('Resource name');
  expect(process.exitCode).toBe(1);
});
