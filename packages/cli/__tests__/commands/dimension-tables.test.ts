import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { http, HttpResponse, server } from '@spotify-confidence/testing';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { createProjectDir, writeJsonFile } from '@spotify-confidence/testing/scaffold';
import { dataCommand } from '@commands/data.js';
import { captureOutput } from '../helpers/capture.js';
import { createRunner } from '../helpers/run-command.js';

const sut = createRunner(dataCommand);
const base = 'https://metrics.eu.confidence.dev/v1/dimensionTables';
const resource = {
  sql: 'SELECT user_id, country, event_time FROM user_dimensions',
  displayName: 'User dimensions',
  description: '',
  entityColumnMapping: { column: { name: 'user_id' }, entity: 'entities/user' },
  dimensions: [{ name: 'country', repeated: false }],
  timeConfig: { timestampColumn: { name: 'event_time' }, window: '86400s' },
  valueMappings: [
    {
      column: 'country',
      mappings: [
        { inputDimensionValue: 'SE', outputDimensionValue: 'Sweden' },
        { inputDimensionValue: null, outputDimensionValue: 'Unknown' },
        { inputDimensionValue: '', outputDimensionValue: null },
        {},
      ],
    },
  ],
  labels: { team: 'growth' },
  owner: 'identities/owner',
  dimensionDataDeliveredUntilTime: '2026-07-01T00:00:00.123456789Z',
  dataDeliveredUntilUpdateStrategyConfig: {
    strategy: 'AUTOMATIC',
    disableEmptyPartitions: true,
    automaticUpdateConfig: {
      commitDelay: '300s',
      incrementDuration: '3600s',
      changeThreshold: { value: '0.01' },
    },
  },
};

function observeRequests(): string[] {
  const requests: string[] = [];
  server.use(
    http.all('*', ({ request }) => {
      requests.push(request.url);
      return HttpResponse.json({ name: 'dimensionTables/unexpected' });
    }),
  );
  return requests;
}

describe('data dimension-tables create', () => {
  it('writes exactly one resource body with camelCase fields and the transcoded ID query parameter', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'dimension.json', resource);
    const requests: { body: unknown; query: string; authorization: string | null }[] = [];
    const response = {
      ...resource,
      name: 'dimensionTables/users',
      state: 'VALIDATING',
      schemaValidationJob: 'sqlJobs/one',
    };
    server.use(
      http.post(base, async ({ request }) => {
        requests.push({
          body: await request.json(),
          query: new URL(request.url).search,
          authorization: request.headers.get('authorization'),
        });
        return HttpResponse.json(response);
      }),
    );

    // Act
    await sut([
      'data',
      'dimension-tables',
      'create',
      '--from-file',
      file,
      '--id',
      'users',
      '--json',
    ]);

    // Assert
    expect(requests).toEqual([
      {
        body: resource,
        query: '?dimensionTableId=users',
        authorization: expect.stringMatching(/^Bearer /u),
      },
    ]);
    expect(JSON.parse(output.stdout).data).toEqual(response);
    expect(process.exitCode ?? 0).toBe(0);
  });

  it('omits the ID when the service should generate it', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'dimension.json', resource);
    const queries: string[] = [];
    server.use(
      http.post(base, ({ request }) => {
        queries.push(new URL(request.url).search);
        return HttpResponse.json({ ...resource, name: 'dimensionTables/generated' });
      }),
    );

    // Act
    await sut(['data', 'dimension-tables', 'create', '--from-file', file, '--json']);

    // Assert
    expect(queries).toEqual(['']);
    expect(JSON.parse(output.stdout).data.name).toBe('dimensionTables/generated');
  });

  it('validates and previews the entire create request without authentication or HTTP', async () => {
    // Arrange
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'dimension.json', resource);
    const requests = observeRequests();

    // Act
    await sut([
      'data',
      'dimension-tables',
      'create',
      '--from-file',
      file,
      '--id',
      'users',
      '--dry-run',
      '--json',
    ]);

    // Assert
    expect(JSON.parse(output.stdout).data).toEqual({
      dryRun: true,
      method: 'POST',
      path: '/v1/dimensionTables',
      params: { dimensionTableId: 'users' },
      body: resource,
    });
    expect(output.stderr).toBe('');
    expect(requests).toEqual([]);
    expect(process.exitCode ?? 0).toBe(0);
  });

  it.each([false, true])(
    'rejects invalid resource JSON before auth or HTTP (dry-run: %s)',
    async (dryRun) => {
      // Arrange
      using _auth = prepareAuthTokens('none');
      using output = captureOutput();
      using project = createProjectDir('empty');
      const file = writeJsonFile(project.path, 'dimension.json', { ...resource, state: 'READY' });
      const requests = observeRequests();

      // Act
      await sut([
        'data',
        'dimension-tables',
        'create',
        '--from-file',
        file,
        ...(dryRun ? ['--dry-run'] : []),
      ]);

      // Assert
      expect(output.stderr).toContain('DimensionTable.state');
      expect(output.stderr).not.toContain('Not logged in');
      expect(output.stdout).toBe('');
      expect(requests).toEqual([]);
      expect(process.exitCode).toBe(1);
    },
  );

  it.each([
    '../users',
    'dimensionTables/users',
    'users/child',
    'users?x=y',
    'users%2Fchild',
    'users#fragment',
    ' users',
    'users\\escape',
  ])('rejects invalid create ID %s before auth or HTTP', async (id) => {
    // Arrange
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'dimension.json', resource);
    const requests = observeRequests();

    // Act
    await sut(['data', 'dimension-tables', 'create', '--from-file', file, '--id', id, '--dry-run']);

    // Assert
    expect(output.stderr).toContain('Resource name');
    expect(output.stderr).not.toContain('Not logged in');
    expect(requests).toEqual([]);
    expect(process.exitCode).toBe(1);
  });

  it('reports malformed JSON before authentication', async () => {
    // Arrange
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = join(project.path, 'broken.json');
    writeFileSync(file, '{');
    const requests = observeRequests();

    // Act
    await sut(['data', 'dimension-tables', 'create', '--from-file', file, '--dry-run']);

    // Assert
    expect(output.stderr).toContain('Invalid JSON');
    expect(requests).toEqual([]);
    expect(process.exitCode).toBe(1);
  });

  it('requires authentication for a valid non-preview create', async () => {
    // Arrange
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'dimension.json', resource);
    const requests = observeRequests();

    // Act
    await sut(['data', 'dimension-tables', 'create', '--from-file', file]);

    // Assert
    expect(output.stderr).toContain('Not logged in');
    expect(requests).toEqual([]);
    expect(process.exitCode).toBe(1);
  });

  it.each([400, 403, 409])('reports HTTP %s without retrying a create', async (status) => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'dimension.json', resource);
    let writes = 0;
    server.use(
      http.post(base, () => {
        writes++;
        return HttpResponse.json({ code: status, message: 'Creation refused' }, { status });
      }),
    );

    // Act
    await sut(['data', 'dimension-tables', 'create', '--from-file', file, '--json']);

    // Assert
    expect(writes).toBe(1);
    expect(output.stderr).toContain('Creation refused');
    expect(output.stderr).not.toContain('outcome is unknown');
    expect(output.stdout).toBe('');
    expect(process.exitCode).toBe(1);
  });

  it.each([
    [500, undefined],
    [502, 'users'],
    [503, 'users'],
  ])('reports HTTP %s as an unknown create outcome (ID: %s)', async (status, id) => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'dimension.json', resource);
    let writes = 0;
    server.use(
      http.post(base, () => {
        writes++;
        return HttpResponse.json({ code: status, message: 'Creation unavailable' }, { status });
      }),
    );

    // Act
    await sut([
      'data',
      'dimension-tables',
      'create',
      '--from-file',
      file,
      ...(id === undefined ? [] : ['--id', id]),
      '--json',
    ]);

    // Assert
    expect(writes).toBe(1);
    expect(output.stderr).toContain('Creation unavailable');
    expect(output.stderr).toContain('outcome is unknown');
    expect(output.stderr).toContain('Do not automatically retry');
    expect(output.stderr).toContain(
      id === undefined ? 'Check existing dimension tables' : 'Requested --id "users"',
    );
    expect(output.stdout).toBe('');
    expect(process.exitCode).toBe(1);
  });

  it.each([
    { status: 200, body: '{', id: undefined, error: 'Invalid JSON response' },
    { status: 204, body: null, id: 'users', error: 'Invalid JSON response' },
    { status: 201, body: '{"state":"READY"}', id: 'users', error: 'response.name' },
    { status: 200, body: 'null', id: undefined, error: 'must be an object' },
    {
      status: 200,
      body: '{"name":"dimensionTables/other"}',
      id: 'users',
      error: 'does not match the requested resource',
    },
  ])(
    'reports a malformed successful create as an unknown outcome: %j',
    async ({ status, body, id, error }) => {
      // Arrange
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      using project = createProjectDir('empty');
      const file = writeJsonFile(project.path, 'dimension.json', resource);
      let writes = 0;
      server.use(
        http.post(base, () => {
          writes++;
          return new HttpResponse(body, { status });
        }),
      );

      // Act
      await sut([
        'data',
        'dimension-tables',
        'create',
        '--from-file',
        file,
        ...(id === undefined ? [] : ['--id', id]),
        '--json',
      ]);

      // Assert
      expect(writes).toBe(1);
      expect(output.stderr).toContain(error);
      expect(output.stderr).toContain('outcome is unknown');
      expect(output.stderr).toContain('Do not automatically retry');
      expect(output.stderr).toContain(
        id === undefined
          ? 'Check existing dimension tables'
          : 'confidence data dimension-tables get users',
      );
      expect(output.stdout).toBe('');
      expect(process.exitCode).toBe(1);
    },
  );

  it.each([undefined, 'users'])(
    'does not retry a network failure and reports an unknown create outcome (ID: %s)',
    async (id) => {
      // Arrange
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      using project = createProjectDir('empty');
      const file = writeJsonFile(project.path, 'dimension.json', resource);
      let writes = 0;
      server.use(
        http.post(base, () => {
          writes++;
          return HttpResponse.error();
        }),
      );

      // Act
      await sut([
        'data',
        'dimension-tables',
        'create',
        '--from-file',
        file,
        ...(id === undefined ? [] : ['--id', id]),
      ]);

      // Assert
      expect(writes).toBe(1);
      expect(output.stderr).toContain('Network error');
      expect(output.stderr).toContain('outcome is unknown');
      expect(output.stderr).toContain('Do not automatically retry');
      expect(output.stderr).toContain(
        id === undefined ? 'Check existing dimension tables' : 'Requested --id "users"',
      );
      expect(output.stdout).toBe('');
      expect(process.exitCode).toBe(1);
    },
  );
});

describe('data dimension-tables get', () => {
  it.each(['users', 'dimensionTables/users'])(
    'preserves the complete not-ready resource for %s with success exit status',
    async (name) => {
      // Arrange
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      const response = {
        ...resource,
        name: 'dimensionTables/users',
        state: 'FAILED',
        error: { message: 'Invalid SQL', details: [{ column: 'country' }] },
        schemaValidationJob: 'sqlJobs/failed',
        creator: 'identities/creator',
        createTime: '2026-07-01T00:00:00Z',
        futureField: { preserved: true },
      };
      server.use(http.get(`${base}/users`, () => HttpResponse.json(response)));

      // Act
      await sut(['data', 'dimension-tables', 'get', name, '--json']);

      // Assert
      expect(JSON.parse(output.stdout).data).toEqual(response);
      expect(output.stderr).toBe('');
      expect(process.exitCode ?? 0).toBe(0);
    },
  );

  it('prints nested state and errors in table output', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${base}/users`, () =>
        HttpResponse.json({
          name: 'dimensionTables/users',
          state: 'VALIDATING',
          error: { message: 'Schema pending' },
        }),
      ),
    );

    await sut(['data', 'dimension-tables', 'get', 'users', '--output', 'table']);

    expect(output.stdout).toContain('VALIDATING');
    expect(output.stdout).toContain('Schema pending');
    expect(process.exitCode ?? 0).toBe(0);
  });

  it.each([
    '../users',
    'dimensionTables/a/b',
    'entities/users',
    'dimensionTables/%2e%2e',
    'users?x=y',
    'users#fragment',
    'users\\escape',
  ])('rejects unsafe resource name %s before auth and HTTP', async (name) => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    const requests = observeRequests();

    await sut(['data', 'dimension-tables', 'get', name, '--dry-run']);

    expect(output.stderr).toContain('Resource name');
    expect(output.stderr).not.toContain('Not logged in');
    expect(requests).toEqual([]);
    expect(process.exitCode).toBe(1);
  });

  it.each([null, [], { name: 'entities/wrong' }, { state: 'READY' }])(
    'reports malformed get response %j',
    async (response) => {
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      server.use(http.get(`${base}/users`, () => HttpResponse.json(response)));

      await sut(['data', 'dimension-tables', 'get', 'users', '--json']);

      expect(output.stdout).toBe('');
      expect(output.stderr).not.toBe('');
      expect(process.exitCode).toBe(1);
    },
  );

  it('rejects a valid resource with a different name than the requested table', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${base}/users`, () =>
        HttpResponse.json({ ...resource, name: 'dimensionTables/other' }),
      ),
    );

    // Act
    await sut(['data', 'dimension-tables', 'get', 'users', '--json']);

    // Assert
    expect(output.stdout).toBe('');
    expect(output.stderr).toContain('does not match the requested resource');
    expect(process.exitCode).toBe(1);
  });

  it('reports a missing table', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${base}/missing`, () =>
        HttpResponse.json({ code: 404, message: 'Table not found' }, { status: 404 }),
      ),
    );

    await sut(['data', 'dimension-tables', 'get', 'missing']);

    expect(output.stderr).toContain('Table not found');
    expect(process.exitCode).toBe(1);
  });
});

describe('data dimension-tables list', () => {
  it('sends all list filters and preserves a single page with its continuation token', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    const queries: Record<string, string>[] = [];
    const response = {
      dimensionTables: [{ name: 'dimensionTables/users', state: 'VALIDATING' }],
      nextPageToken: 'next+/=',
      extra: { total: 20 },
    };
    server.use(
      http.get(base, ({ request }) => {
        queries.push(Object.fromEntries(new URL(request.url).searchParams));
        return HttpResponse.json(response);
      }),
    );

    // Act
    await sut([
      'data',
      'dimension-tables',
      'list',
      '--page-size',
      '2',
      '--page-token',
      'start+/=',
      '--filter',
      'displayName:"User dimensions"',
      '--order-by',
      'displayName:desc',
      '--show-deleted',
      '--json',
    ]);

    // Assert
    expect(queries).toEqual([
      {
        pageSize: '2',
        pageToken: 'start+/=',
        filter: 'displayName:"User dimensions"',
        orderBy: 'displayName:desc',
        showDeleted: 'true',
      },
    ]);
    expect(JSON.parse(output.stdout).data).toEqual(response);
  });

  it('fetches all pages, retaining filters and treating continuation tokens only as query values', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    const token = 'https://untrusted.example/next?token=abc';
    const queries: Record<string, string>[] = [];
    server.use(
      http.get(base, ({ request }) => {
        const params = Object.fromEntries(new URL(request.url).searchParams);
        queries.push(params);
        return HttpResponse.json(
          params.pageToken === 'start'
            ? { dimensionTables: [{ name: 'dimensionTables/one' }], nextPageToken: token }
            : { dimensionTables: [{ name: 'dimensionTables/two' }], nextPageToken: '' },
        );
      }),
    );

    // Act
    await sut([
      'data',
      'dimension-tables',
      'list',
      '--all',
      '--page-token',
      'start',
      '--page-size',
      '1',
      '--filter',
      'state:READY',
      '--order-by',
      'displayName:asc',
      '--show-deleted=false',
      '--json',
    ]);

    // Assert
    expect(queries).toEqual(
      ['start', token].map((pageToken) => ({
        pageToken,
        pageSize: '1',
        filter: 'state:READY',
        orderBy: 'displayName:asc',
        showDeleted: 'false',
      })),
    );
    expect(JSON.parse(output.stdout).data).toEqual({
      dimensionTables: [{ name: 'dimensionTables/one' }, { name: 'dimensionTables/two' }],
      nextPageToken: '',
    });
  });

  it.each([{}, { dimensionTables: [] }])(
    'accepts an empty protobuf list response %j',
    async (response) => {
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      server.use(http.get(base, () => HttpResponse.json(response)));

      await sut(['data', 'dimension-tables', 'list', '--json']);

      expect(JSON.parse(output.stdout).data.dimensionTables).toEqual([]);
      expect(process.exitCode ?? 0).toBe(0);
    },
  );

  it.each([false, true])(
    'stops repeated tokens including the initial token (initial token: %s)',
    async (initialToken) => {
      // Arrange
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      let reads = 0;
      server.use(
        http.get(base, () => {
          reads++;
          return HttpResponse.json({ dimensionTables: [], nextPageToken: 'same' });
        }),
      );

      // Act
      await sut([
        'data',
        'dimension-tables',
        'list',
        '--all',
        ...(initialToken ? ['--page-token', 'same'] : []),
        '--json',
      ]);

      // Assert
      expect(reads).toBe(initialToken ? 1 : 2);
      expect(output.stderr).toContain('repeated a page token');
      expect(output.stdout).toBe('');
      expect(process.exitCode).toBe(1);
    },
  );

  it.each([
    null,
    [],
    { dimensionTables: {} },
    { dimensionTables: [null] },
    { dimensionTables: [{ name: 'entities/wrong' }] },
    { dimensionTables: [], nextPageToken: 123 },
    { dimensionTables: [], nextPageToken: {} },
  ])('rejects invalid list response %j', async (response) => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(http.get(base, () => HttpResponse.json(response)));

    await sut(['data', 'dimension-tables', 'list', '--all', '--json']);

    expect(output.stdout).toBe('');
    expect(output.stderr).not.toBe('');
    expect(process.exitCode).toBe(1);
  });

  it.each([false, true])(
    'bounds unique pagination tokens at 1000 pages (last page is final: %s)',
    async (lastPageIsFinal) => {
      // Arrange
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      let reads = 0;
      server.use(
        http.get(base, () => {
          reads++;
          return HttpResponse.json({
            dimensionTables: [{ name: `dimensionTables/table-${reads}` }],
            nextPageToken: lastPageIsFinal && reads === 1000 ? '' : `cursor-${reads}`,
          });
        }),
      );

      // Act
      await sut(['data', 'dimension-tables', 'list', '--all', '--json']);

      // Assert
      expect(reads).toBe(1000);
      if (lastPageIsFinal) {
        expect(JSON.parse(output.stdout).data.dimensionTables).toHaveLength(1000);
        expect(output.stderr).toBe('');
        expect(process.exitCode ?? 0).toBe(0);
      } else {
        expect(output.stdout).toBe('');
        expect(output.stderr).toContain('exceeded the 1000-page limit');
        expect(output.stderr).toContain('No partial results returned');
        expect(process.exitCode).toBe(1);
      }
    },
    30_000,
  );

  it('reports a later page error without returning incomplete success', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(base, ({ request }) =>
        new URL(request.url).searchParams.has('pageToken')
          ? HttpResponse.json({ code: 403, message: 'No more access' }, { status: 403 })
          : HttpResponse.json({
              dimensionTables: [{ name: 'dimensionTables/one' }],
              nextPageToken: 'two',
            }),
      ),
    );

    // Act
    await sut(['data', 'dimension-tables', 'list', '--all', '--json']);

    // Assert
    expect(output.stdout).toBe('');
    expect(output.stderr).toContain('No more access');
    expect(process.exitCode).toBe(1);
  });

  it.each(['0', '-1', '1.5', 'NaN', '2147483648'])(
    'rejects invalid page size %s before auth or HTTP',
    async (size) => {
      using _auth = prepareAuthTokens('none');
      using output = captureOutput();
      const requests = observeRequests();

      await sut(['data', 'dimension-tables', 'list', '--page-size', size, '--dry-run']);

      expect(output.stderr).toContain('--page-size');
      expect(output.stderr).not.toContain('Not logged in');
      expect(requests).toEqual([]);
      expect(process.exitCode).toBe(1);
    },
  );
});

describe('data dimension-tables read boundaries', () => {
  it.each([['list'], ['get', 'users']])(
    'requires authentication for %j without HTTP',
    async (...action) => {
      using _auth = prepareAuthTokens('none');
      using output = captureOutput();
      const requests = observeRequests();

      await sut(['data', 'dimension-tables', ...action, '--json']);

      expect(output.stderr).toContain('Not logged in');
      expect(requests).toEqual([]);
      expect(process.exitCode).toBe(1);
    },
  );

  it.each([
    ['list', '--all'],
    ['get', 'users'],
  ])('previews %j without auth or HTTP', async (...action) => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    const requests = observeRequests();

    await sut(['data', 'dimension-tables', ...action, '--dry-run', '--json']);

    expect(JSON.parse(output.stdout).data).toMatchObject({ dryRun: true, method: 'GET' });
    expect(output.stderr).toBe('');
    expect(requests).toEqual([]);
    expect(process.exitCode ?? 0).toBe(0);
  });
});
