import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { http, HttpResponse, server } from '@spotify-confidence/testing';
import { buildTestJwt, prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { createProjectDir, writeJsonFile } from '@spotify-confidence/testing/scaffold';
import { dataCommand } from '@commands/data.js';
import { COLUMN_TYPES } from '@network/metrics-column-suggestions.js';
import { captureOutput } from '../helpers/capture.js';
import { createRunner } from '../helpers/run-command.js';

const run = createRunner(dataCommand);
const args = ['data', 'fact-tables', 'suggest-columns'];
const endpoint = 'https://metrics.eu.confidence.dev/v1/factTables:suggestFactTableColumns';
const approvedSchema = {
  schema: [
    { name: 'event_time', type: 'COLUMN_TYPE_TIMESTAMP', repeated: false },
    { name: 'user_id', type: 'COLUMN_TYPE_STRING' },
    { name: 'amount', type: 10 },
    { name: 'tags', repeated: true },
  ],
};
const suggestion = {
  timestampColumn: 'event_time',
  entities: [{ column: 'user_id', entity: 'entities/user' }],
  measures: ['amount'],
  dimensions: ['tags'],
};

function recordRequests(
  response: Parameters<typeof HttpResponse.json>[0] = { suggestion },
  status = 200,
) {
  const requests: { method: string; url: string; body: unknown }[] = [];
  server.use(
    http.all('*', async ({ request }) => {
      const entry = { method: request.method, url: request.url, body: undefined as unknown };
      requests.push(entry);
      if (request.body) entry.body = await request.json();
      return HttpResponse.json(response, { status });
    }),
  );
  return requests;
}

describe('data fact-tables suggest-columns', () => {
  it('sends only the approved schema to the suggestion endpoint and prints the full JSON response', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'approved-schema.json', approvedSchema);
    const response = { suggestion, futureField: 'preserved' };
    const requests = recordRequests(response);
    const sut = run;

    // Act
    await sut([...args, '--from-file', file, '--json']);

    // Assert
    expect(JSON.parse(output.stdout)).toEqual({ data: response });
    expect(output.stderr).toBe('');
    expect(requests).toEqual([{ method: 'POST', url: endpoint, body: approvedSchema }]);
  });

  it('uses the selected profile token and Metrics API region', async () => {
    // Arrange
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'schema.json', approvedSchema);
    const token = buildTestJwt({ 'https://confidence.dev/region': 'US' });
    const profileDir = join(process.env.CONFIDENCE_CONFIG_DIR!, 'profiles', 'suggestions');
    mkdirSync(profileDir, { recursive: true });
    writeFileSync(join(profileDir, 'credentials.json'), JSON.stringify({ accessToken: token }));
    const requests: { url: string; authorization: string | null; body: unknown }[] = [];
    server.use(
      http.all('*', async ({ request }) => {
        requests.push({
          url: request.url,
          authorization: request.headers.get('authorization'),
          body: await request.json(),
        });
        return HttpResponse.json({ suggestion });
      }),
    );
    const sut = run;

    // Act
    await sut([...args, '--from-file', file, '--profile', 'suggestions', '--json']);

    // Assert
    expect(requests).toEqual([
      {
        url: 'https://metrics.us.confidence.dev/v1/factTables:suggestFactTableColumns',
        authorization: `Bearer ${token}`,
        body: approvedSchema,
      },
    ]);
    expect(JSON.parse(output.stdout)).toEqual({ data: { suggestion } });
    expect(output.stderr).toBe('');
  });

  it('renders advisory classifications as a table when requested', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'schema.json', approvedSchema);
    recordRequests();
    const sut = run;

    await sut([...args, '--from-file', file, '--output', 'table']);

    expect(output.stdout).toContain('suggestion');
    expect(output.stdout).toContain('event_time');
    expect(output.stdout).toContain('entities/user');
    expect(output.stdout).not.toContain('Created');
  });

  it('accepts every proto ColumnType name and numeric value, including omitted optional fields', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const body = {
      schema: [
        { name: 'untyped' },
        ...COLUMN_TYPES.map((type, index) => ({ name: `named_${index}`, type })),
        ...COLUMN_TYPES.map((_type, type) => ({ name: `numeric_${type}`, type })),
      ],
    };
    const file = writeJsonFile(project.path, 'schema.json', body);
    const requests = recordRequests();
    const sut = run;

    await sut([...args, '--from-file', file, '--json']);

    expect(output.stderr).toBe('');
    expect(requests).toEqual([{ method: 'POST', url: endpoint, body }]);
  });

  it('previews the validated request before authentication and sends no HTTP requests in dry-run', async () => {
    // Arrange
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'schema.json', approvedSchema);
    const contents = readFileSync(file, 'utf8');
    const configDir = process.env.CONFIDENCE_CONFIG_DIR!;
    const filesBefore = readdirSync(configDir, { recursive: true });
    const requests = recordRequests();
    const sut = run;

    // Act
    await sut([...args, '--from-file', file, '--dry-run', '--profile', '../invalid', '--json']);

    // Assert
    expect(JSON.parse(output.stdout)).toEqual({
      data: {
        method: 'POST',
        path: '/v1/factTables:suggestFactTableColumns',
        body: approvedSchema,
      },
    });
    expect(output.stderr).toBe('');
    expect(requests).toEqual([]);
    expect(readdirSync(configDir, { recursive: true })).toEqual(filesBefore);
    expect(readFileSync(file, 'utf8')).toBe(contents);
  });

  it.each(['none', 'expired'] as const)('sends no request with %s credentials', async (auth) => {
    using _auth = prepareAuthTokens(auth);
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'schema.json', approvedSchema);
    const requests = recordRequests();
    const sut = run;

    await sut([...args, '--from-file', file]);

    expect(output.stderr).toContain('confidence login');
    expect(process.exitCode).toBe(1);
    expect(requests).toEqual([]);
  });

  const invalidInputs = [
    null,
    [],
    'schema',
    {},
    { schema: [] },
    { schema: {} },
    { schema: [null] },
    { schema: [[]] },
    { schema: ['event_time'] },
    { schema: [{}] },
    { schema: [{ name: '' }] },
    { schema: [{ name: '  ' }] },
    { schema: [{ name: 42 }] },
    { schema: [{ name: 'event_time', type: 'TIMESTAMP' }] },
    { schema: [{ name: 'event_time', type: 'COLUMN_TYPE_NEW' }] },
    { schema: [{ name: 'event_time', type: -1 }] },
    { schema: [{ name: 'event_time', type: 12 }] },
    { schema: [{ name: 'event_time', type: 1.5 }] },
    { schema: [{ name: 'event_time', type: null }] },
    { schema: [{ name: 'event_time', type: {} }] },
    { schema: [{ name: 'event_time', repeated: 'false' }] },
    { schema: [{ name: 'event_time', repeated: null }] },
    { schema: [{ name: 'event_time', rows: ['secret row'] }] },
    { schema: [{ name: 'event_time', description: 'unapproved annotation' }] },
    { schema: [{ name: 'event_time', classification: 'timestamp' }] },
    { schema: [{ name: 'event_time', annotation: { timestamp: true } }] },
    { schema: [{ name: 'event_time', newColumnAnnotation: 'not approved' }] },
    { ...approvedSchema, rows: [['secret row']] },
    { ...approvedSchema, sampleRows: [['secret row']] },
    { ...approvedSchema, warehouseConfig: { secret: 'must not be sent' } },
  ];

  describe.each([false, true])('input validation (dry-run=%s)', (dryRun) => {
    it.each(invalidInputs.map((input) => [JSON.stringify(input), input]))(
      'rejects %s before authentication or HTTP',
      async (_label, input) => {
        // Arrange
        using _auth = prepareAuthTokens('none');
        using output = captureOutput();
        using project = createProjectDir('empty');
        const file = writeJsonFile(project.path, 'invalid.json', input);
        const requests = recordRequests();
        const sut = run;

        // Act
        await sut([...args, '--from-file', file, ...(dryRun ? ['--dry-run'] : [])]);

        // Assert
        expect(process.exitCode).toBe(1);
        expect(output.stderr).not.toBe('');
        expect(output.stderr).not.toContain('Not logged in');
        expect(output.stdout).toBe('');
        expect(requests).toEqual([]);
      },
    );
  });

  it.each(['missing', 'malformed'])(
    'rejects a %s schema file without making requests',
    async (kind) => {
      using _auth = prepareAuthTokens('none');
      using output = captureOutput();
      using project = createProjectDir('empty');
      const file = join(project.path, 'schema.json');
      if (kind === 'malformed') writeFileSync(file, '{not json');
      const requests = recordRequests();
      const sut = run;

      await sut([...args, '--from-file', file, '--dry-run']);

      expect(output.stderr).toContain(
        kind === 'missing' ? 'Could not read schema file' : 'Invalid JSON',
      );
      expect(process.exitCode).toBe(1);
      expect(requests).toEqual([]);
    },
  );

  it('reports a suggestion error from HTTP 200 as a failure, not a successful suggestion', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'schema.json', approvedSchema);
    const requests = recordRequests({ error: 'Could not classify columns' });
    const sut = run;

    await sut([...args, '--from-file', file, '--json']);

    expect(process.exitCode).toBe(1);
    expect(output.stderr).toContain('Could not classify columns');
    expect(output.stdout).toBe('');
    expect(requests).toHaveLength(1);
  });

  it.each(
    [
      null,
      [],
      {},
      { suggestion, error: 'contradictory response' },
      { suggestion, error: '' },
      { suggestion: null },
      { suggestion: [] },
      { suggestion: 'not an object' },
      { error: '' },
      { error: 42 },
      { error: null },
    ].map((response) => [response]),
  )('fails closed for malformed response %j', async (response) => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'schema.json', approvedSchema);
    recordRequests(response);
    const sut = run;

    await sut([...args, '--from-file', file, '--json']);

    expect(process.exitCode).toBe(1);
    expect(output.stderr).not.toBe('');
    expect(output.stdout).toBe('');
  });

  it.each([400, 403, 500])(
    'reports HTTP %s errors without creating tables or retrying',
    async (status) => {
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      using project = createProjectDir('empty');
      const file = writeJsonFile(project.path, 'schema.json', approvedSchema);
      const requests = recordRequests({ code: 3, message: 'Suggestion request rejected' }, status);
      const sut = run;

      await sut([...args, '--from-file', file, '--json']);

      expect(process.exitCode).toBe(1);
      expect(output.stderr).toContain('Suggestion request rejected');
      expect(output.stdout).toBe('');
      expect(requests).toEqual([{ method: 'POST', url: endpoint, body: approvedSchema }]);
    },
  );
});
