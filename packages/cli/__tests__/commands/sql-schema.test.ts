import { http, HttpResponse, server } from '@spotify-confidence/testing';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { sqlCommand } from '@commands/data/sql.js';
import { captureOutput } from '../helpers/capture.js';
import { createRunner } from '../helpers/run-command.js';

const sut = createRunner(sqlCommand);
const name = 'sqlJobs/preview-1';
const url = `https://metrics.eu.confidence.dev/v1/${name}/sampleRows`;
const secret = 'PRIVATE_SAMPLE_VALUE_DO_NOT_PRINT';

it.each([true, false])(
  'projects schema and warnings without sample rows (JSON=%s)',
  async (json) => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    const schema = [
      { name: 'user_id', type: 'STRING', repeated: false },
      { name: 'count', type: 3 },
    ];
    const issues = [{ name: 'count', message: 'Check nullable values.' }];
    const tableIssues = [{ severity: 'WARNING', message: 'No time column.' }];
    server.use(
      http.get(url, () =>
        HttpResponse.json({
          name,
          sampleRows: [{ values: { user_id: secret, count: secret } }],
          unknown: secret,
          successfulQueryResult: {
            schema: schema.map((column) => ({ ...column, sampleRows: secret })),
            issues: issues.map((issue) => ({ ...issue, unknown: secret })),
            tableIssues: tableIssues.map((issue) => ({ ...issue, unknown: secret })),
            jobStats: { unknown: secret },
          },
        }),
      ),
    );

    // Act
    await sut(['sql', 'schema', '--name', name, ...(json ? ['--json'] : [])]);

    // Assert
    expect(output.stdout).not.toContain(secret);
    expect(output.stderr).not.toContain(secret);
    expect(output.stdout).not.toContain('sampleRows');
    expect(process.exitCode ?? 0).toBe(0);
    if (json)
      expect(JSON.parse(output.stdout)).toEqual({
        data: { name, state: 'COMPLETED', schema, issues, tableIssues },
      });
    else expect(output.stdout).toContain('user_id');
  },
);

it('normalizes omitted protobuf repeated fields only after confirmed success', async () => {
  // Arrange
  using _auth = prepareAuthTokens('valid');
  using output = captureOutput();
  server.use(http.get(url, () => HttpResponse.json({ name, successfulQueryResult: {} })));

  // Act
  await sut(['sql', 'schema', '--name', name, '--json']);

  // Assert
  expect(JSON.parse(output.stdout).data).toEqual({
    name,
    state: 'COMPLETED',
    schema: [],
    issues: [],
    tableIssues: [],
  });
});

it('reports pending without inventing an empty completed schema', async () => {
  // Arrange
  using _auth = prepareAuthTokens('valid');
  using output = captureOutput();
  server.use(
    http.get(url, () =>
      HttpResponse.json({ name, pendingQueryResult: {}, sampleRows: [{ values: { secret } }] }),
    ),
  );

  // Act
  await sut(['sql', 'schema', '--name', name, '--json']);

  // Assert
  expect(JSON.parse(output.stdout).data).toEqual({ name, state: 'PENDING', schema: null });
  expect(process.exitCode ?? 0).toBe(0);
});

it('inspects a failed query successfully without exposing rows', async () => {
  // Arrange
  using _auth = prepareAuthTokens('valid');
  using output = captureOutput();
  server.use(
    http.get(url, () =>
      HttpResponse.json({
        name,
        failedQueryResult: { error: 'Permission denied', reason: 'ACCESS_DENIED' },
        sampleRows: [{ values: { secret } }],
      }),
    ),
  );

  // Act
  await sut(['sql', 'schema', '--name', name, '--json']);

  // Assert
  expect(process.exitCode ?? 0).toBe(0);
  expect(JSON.parse(output.stdout).data).toEqual({
    name,
    state: 'FAILED',
    schema: null,
    failedQueryResult: { error: 'Permission denied', reason: 'ACCESS_DENIED' },
  });
  expect(output.stderr).toBe('');
  expect(output.stdout).not.toContain(secret);
});

it.each([
  null,
  [],
  {},
  { name: 'sqlJobs/other', successfulQueryResult: {} },
  { name, successfulQueryResult: null },
  { name, pendingQueryResult: null },
  { name, successfulQueryResult: {}, pendingQueryResult: {} },
  { name, successfulQueryResult: { schema: null } },
  { name, successfulQueryResult: { schema: [null] } },
  { name, successfulQueryResult: { schema: [{ name: '' }] } },
  { name, successfulQueryResult: { schema: [{ name: 'id', type: {} }] } },
  { name, successfulQueryResult: { schema: [{ name: 'id', repeated: 'false' }] } },
  { name, successfulQueryResult: { issues: {} } },
  { name, successfulQueryResult: { issues: [{ message: 1 }] } },
  { name, successfulQueryResult: { tableIssues: [{ severity: {} }] } },
  { name, failedQueryResult: { error: {} } },
])('rejects malformed sample results without printing their content: %j', async (body) => {
  // Arrange
  using _auth = prepareAuthTokens('valid');
  using output = captureOutput();
  server.use(http.get(url, () => HttpResponse.json(body)));

  // Act
  await sut(['sql', 'schema', '--name', name, '--json']);

  // Assert
  expect(process.exitCode).toBe(1);
  expect(output.stdout).toBe('');
  expect(output.stderr).not.toContain(secret);
});

it.each([403, 404, 500])('reports HTTP %s as a failure', async (status) => {
  // Arrange
  using _auth = prepareAuthTokens('valid');
  using output = captureOutput();
  server.use(
    http.get(url, () =>
      HttpResponse.json({ code: status, message: 'Unavailable schema' }, { status }),
    ),
  );

  // Act
  await sut(['sql', 'schema', '--name', name, '--json']);

  // Assert
  expect(process.exitCode).toBe(1);
  expect(output.stderr).toContain('Unavailable schema');
  expect(output.stdout).toBe('');
});

it('validates a dry-run locally without authentication or HTTP', async () => {
  // Arrange
  using _auth = prepareAuthTokens('none');
  using output = captureOutput();
  let requests = 0;
  server.use(
    http.get(url, () => {
      requests += 1;
      return HttpResponse.json({});
    }),
  );

  // Act
  await sut(['sql', 'schema', '--name', name, '--dry-run', '--json']);

  // Assert
  expect(requests).toBe(0);
  expect(output.stderr).toBe('');
  expect(JSON.parse(output.stdout).data).toEqual({
    dryRun: true,
    operation: 'sql.schema',
    path: '/v1/sqlJobs/preview-1/sampleRows',
    name,
  });
});

it.each([
  'preview-1',
  'factTables/id',
  'sqlJobs/../id',
  'sqlJobs/id/rows',
  'sqlJobs/id?token=x',
  'sqlJobs/id%2Frows',
])('rejects unsafe names locally: %s', async (invalid) => {
  // Arrange
  using _auth = prepareAuthTokens('none');
  using output = captureOutput();

  // Act
  await sut(['sql', 'schema', '--name', invalid, '--dry-run', '--json']);

  // Assert
  expect(process.exitCode).toBe(1);
  expect(output.stdout).toBe('');
  expect(output.stderr).not.toContain('Not logged in');
});
