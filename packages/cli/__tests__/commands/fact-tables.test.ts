import { mkdirSync, writeFileSync } from 'node:fs';
import { server, http, HttpResponse } from '@spotify-confidence/testing';
import { buildTestJwt, prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { createProjectDir, writeJsonFile } from '@spotify-confidence/testing/scaffold';
import { dataCommand } from '@commands/data.js';
import { captureOutput } from '../helpers/capture.js';
import { createRunner } from '../helpers/run-command.js';

const sut = createRunner(dataCommand);
const BASE = 'https://metrics.eu.confidence.dev/v1/factTables';
const malformedResources = [
  null,
  [],
  'not a resource',
  {},
  { name: 5 },
  { name: '' },
  { name: 'purchases' },
  { name: 'entities/user' },
  { name: 'factTables/../unsafe' },
  { name: 'factTables/a/b' },
  { name: 'factTables/%2funsafe' },
  { name: 'https://evil.test/factTables/a' },
];

function resource() {
  return {
    sql: 'SELECT ts, user_id, amount FROM purchases',
    displayName: 'Purchases',
    timestampColumn: { name: 'ts' },
    entities: [{ column: { name: 'user_id' }, entity: 'entities/user' }],
    measures: [{ column: { name: 'amount' }, unit: { currencyCode: 'USD' } }],
    dimensions: [{ name: 'product', repeated: true }],
    description: 'Orders placed',
    labels: { team: 'growth', state: 'custom label' },
    owner: 'identities/owner',
    factDataDeliveredUntilTime: '2026-05-01T00:00:00Z',
    dataDeliveredUntilUpdateStrategyConfig: {
      strategy: 'AUTOMATIC',
      automaticUpdateConfig: {
        commitDelay: '3600s',
        incrementDuration: '60s',
        changeThreshold: { value: '0.01' },
      },
      disableEmptyPartitions: true,
    },
  };
}

function observeRequests() {
  const requests: string[] = [];
  const listener = ({ request }: { request: Request }) =>
    requests.push(`${request.method} ${request.url}`);
  server.events.on('request:start', listener);
  return {
    requests,
    [Symbol.dispose]() {
      server.events.removeListener('request:start', listener);
    },
  };
}

describe('data fact-tables list', () => {
  it('prints the full page and sends supported query parameters to Metrics', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    const data = {
      factTables: [
        { name: 'factTables/purchases', state: 'TABLE_STATE_ACTIVE', labels: { team: 'growth' } },
      ],
      nextPageToken: 'next',
      otherMetadata: { total: 5 },
    };
    const received: URL[] = [];
    server.use(
      http.get(BASE, ({ request }) => {
        received.push(new URL(request.url));
        return HttpResponse.json(data);
      }),
    );

    // Act
    await sut([
      'data',
      'fact-tables',
      'list',
      '--page-size',
      '5',
      '--page-token',
      'cursor +/=',
      '--filter',
      'displayName:Purchases',
      '--show-deleted',
      '--order-by',
      'displayName:desc,createTime:asc',
      '--json',
    ]);

    // Assert
    expect(JSON.parse(output.stdout)).toEqual({ data });
    expect(received).toHaveLength(1);
    expect(Object.fromEntries(received[0].searchParams)).toEqual({
      pageSize: '5',
      pageToken: 'cursor +/=',
      filter: 'displayName:Purchases',
      showDeleted: 'true',
      orderBy: 'displayName:desc,createTime:asc',
    });
  });

  it.each([{}, { factTables: [] }])('prints an empty list for %j', async (data) => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(http.get(BASE, () => HttpResponse.json(data)));

    await sut(['data', 'fact-tables', 'list', '--json']);

    expect(JSON.parse(output.stdout).data.factTables).toEqual([]);
    expect(process.exitCode ?? 0).toBe(0);
  });

  it('traverses pages only with --all and keeps list options on every page', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    const received: URL[] = [];
    server.use(
      http.get(BASE, ({ request }) => {
        const url = new URL(request.url);
        received.push(url);
        return HttpResponse.json(
          url.searchParams.has('pageToken')
            ? { factTables: [{ name: 'factTables/second', state: 'TABLE_STATE_FAILED' }] }
            : { factTables: [{ name: 'factTables/first' }], nextPageToken: 'second' },
        );
      }),
    );

    // Act
    await sut([
      'data',
      'fact-tables',
      'list',
      '--all',
      '--max-pages',
      '3',
      '--max-items',
      '5',
      '--filter',
      'team:growth',
      '--show-deleted=false',
      '--order-by',
      'displayName:asc',
      '--json',
    ]);

    // Assert
    expect(JSON.parse(output.stdout).data.factTables).toEqual([
      { name: 'factTables/first' },
      { name: 'factTables/second', state: 'TABLE_STATE_FAILED' },
    ]);
    expect(received.map((url) => url.searchParams.get('pageToken'))).toEqual([null, 'second']);
    expect(
      received.every(
        (url) =>
          url.searchParams.get('filter') === 'team:growth' &&
          url.searchParams.get('showDeleted') === 'false' &&
          url.searchParams.get('orderBy') === 'displayName:asc',
      ),
    ).toBe(true);
  });

  it.each([
    ['--max-pages', '1', '--max-items', '10'],
    ['--max-pages', '10', '--max-items', '1'],
  ])('retains the continuation token when a bound is reached: %j', async (...bounds) => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    using requests = observeRequests();
    server.use(
      http.get(BASE, () =>
        HttpResponse.json({ factTables: [{ name: 'factTables/first' }], nextPageToken: 'more' }),
      ),
    );

    await sut(['data', 'fact-tables', 'list', '--all', ...bounds, '--json']);

    expect(JSON.parse(output.stdout).data.nextPageToken).toBe('more');
    expect(requests.requests).toHaveLength(1);
  });

  it('reduces page size to the remaining item bound and preserves the continuation token', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    const received: URL[] = [];
    server.use(
      http.get(BASE, ({ request }) => {
        const url = new URL(request.url);
        received.push(url);
        return HttpResponse.json({
          factTables: Array.from({ length: Number(url.searchParams.get('pageSize')) }, (_, i) => ({
            name: `factTables/page${received.length}-item${i}`,
          })),
          nextPageToken: `page${received.length + 1}`,
        });
      }),
    );

    // Act
    await sut([
      'data',
      'fact-tables',
      'list',
      '--all',
      '--page-size',
      '2',
      '--max-pages',
      '10',
      '--max-items',
      '3',
      '--json',
    ]);

    // Assert
    expect(received.map((url) => url.searchParams.get('pageSize'))).toEqual(['2', '1']);
    expect(JSON.parse(output.stdout).data).toEqual({
      factTables: [
        { name: 'factTables/page1-item0' },
        { name: 'factTables/page1-item1' },
        { name: 'factTables/page2-item0' },
      ],
      nextPageToken: 'page3',
    });
  });

  it('fails instead of silently truncating if the service exceeds the item bound', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    using requests = observeRequests();
    server.use(
      http.get(BASE, () =>
        HttpResponse.json({
          factTables: [{ name: 'factTables/first' }, { name: 'factTables/second' }],
        }),
      ),
    );

    await sut([
      'data',
      'fact-tables',
      'list',
      '--all',
      '--max-pages',
      '2',
      '--max-items',
      '1',
      '--json',
    ]);

    expect(output.stderr).toContain('service did not honor pageSize');
    expect(output.stdout).toBe('');
    expect(requests.requests).toHaveLength(1);
    expect(process.exitCode).toBe(1);
  });

  it.each([[], { factTables: null }, { factTables: {} }, { nextPageToken: 5 }])(
    'reports malformed list response %j without printing success',
    async (data) => {
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      server.use(http.get(BASE, () => HttpResponse.json(data)));

      await sut(['data', 'fact-tables', 'list', '--json']);

      expect(output.stderr).toContain('Fact table list response');
      expect(output.stdout).toBe('');
      expect(process.exitCode).toBe(1);
    },
  );

  it.each(malformedResources.map((item) => ({ item })))(
    'rejects a malformed list entry $item even after a valid entry',
    async ({ item }) => {
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      using requests = observeRequests();
      server.use(
        http.get(BASE, () =>
          HttpResponse.json({
            factTables: [{ name: 'factTables/valid' }, item],
            nextPageToken: 'more',
          }),
        ),
      );

      await sut(['data', 'fact-tables', 'list', '--json']);

      expect(output.stderr).not.toBe('');
      expect(output.stdout).toBe('');
      expect(requests.requests).toHaveLength(1);
      expect(process.exitCode).toBe(1);
    },
  );

  it('stops on a repeated token rather than looping', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    using requests = observeRequests();
    server.use(http.get(BASE, () => HttpResponse.json({ factTables: [], nextPageToken: 'same' })));

    await sut([
      'data',
      'fact-tables',
      'list',
      '--all',
      '--max-pages',
      '5',
      '--max-items',
      '10',
      '--json',
    ]);

    expect(output.stderr).toContain('repeated page token');
    expect(requests.requests).toHaveLength(2);
    expect(output.stdout).toBe('');
    expect(process.exitCode).toBe(1);
  });

  it('does not print a misleading partial success when a later page fails', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(BASE, ({ request }) =>
        new URL(request.url).searchParams.has('pageToken')
          ? HttpResponse.json({ code: 403, message: 'Permission denied' }, { status: 403 })
          : HttpResponse.json({
              factTables: [{ name: 'factTables/first' }],
              nextPageToken: 'second',
            }),
      ),
    );

    await sut([
      'data',
      'fact-tables',
      'list',
      '--all',
      '--max-pages',
      '3',
      '--max-items',
      '5',
      '--json',
    ]);

    expect(output.stderr).toContain('Permission denied');
    expect(output.stdout).toBe('');
    expect(process.exitCode).toBe(1);
  });

  it.each([
    ['--all'],
    ['--all', '--max-pages', '2'],
    ['--max-pages', '2'],
    ['--page-size', '0'],
    ['--page-size', '1.5'],
    ['--all', '--max-pages', '-1', '--max-items', '5'],
    ['--all', '--max-pages', '1001', '--max-items', '5'],
    ['--all', '--max-pages', '2', '--max-items', '0'],
  ])('rejects invalid pagination before authentication: %j', async (...options) => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    using requests = observeRequests();

    await sut(['data', 'fact-tables', 'list', ...options]);

    expect(output.stderr).toContain('--');
    expect(output.stderr).not.toContain('Not logged in');
    expect(requests.requests).toEqual([]);
    expect(process.exitCode).toBe(1);
  });
});

describe('data fact-tables get', () => {
  it.each(['TABLE_STATE_ACTIVE', 'TABLE_STATE_CREATING', 'TABLE_STATE_FAILED'])(
    'preserves %s and lifecycle details without treating it as an HTTP error',
    async (state) => {
      // Arrange
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      const data = {
        name: 'factTables/purchases',
        state,
        error: { message: 'warehouse validation detail', details: ['column not found'] },
        schemaValidationJob: 'sqlJobs/job',
        createTime: '2026-05-01T00:00:00Z',
        partitionedUpdateStrategyState: { job: 'sqlJobs/update' },
      };
      server.use(http.get(`${BASE}/purchases`, () => HttpResponse.json(data)));

      // Act
      await sut(['data', 'fact-tables', 'get', '--name', 'factTables/purchases', '--json']);

      // Assert
      expect(JSON.parse(output.stdout)).toEqual({ data });
      expect(output.stderr).toBe('');
      expect(process.exitCode ?? 0).toBe(0);
    },
  );

  it('renders lifecycle fields in human-readable output too', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${BASE}/purchases`, () =>
        HttpResponse.json({
          name: 'factTables/purchases',
          state: 'TABLE_STATE_FAILED',
          error: { message: 'Invalid SQL' },
        }),
      ),
    );

    await sut(['data', 'fact-tables', 'get', 'factTables/purchases', '--output', 'table']);

    expect(output.stdout).toContain('TABLE_STATE_FAILED');
    expect(output.stdout).toContain('Invalid SQL');
    expect(process.exitCode ?? 0).toBe(0);
  });

  it.each([
    'purchases',
    'factTables/../purchases',
    'factTables/a/b',
    'factTables/%2fsecret',
    'https://evil.test/factTables/a',
    'entities/a',
  ])('rejects unsafe or unqualified name %s without HTTP', async (name) => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    using requests = observeRequests();

    await sut(['data', 'fact-tables', 'get', name]);

    expect(output.stderr).toContain('Resource name');
    expect(requests.requests).toEqual([]);
    expect(process.exitCode).toBe(1);
  });

  it.each(malformedResources.map((data) => ({ data })))(
    'rejects malformed successful get response $data',
    async ({ data }) => {
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      server.use(http.get(`${BASE}/purchases`, () => HttpResponse.json(data)));

      await sut(['data', 'fact-tables', 'get', 'factTables/purchases', '--json']);

      expect(output.stderr).not.toBe('');
      expect(output.stdout).toBe('');
      expect(process.exitCode).toBe(1);
    },
  );

  it('reports a remote 404 as a command failure', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${BASE}/missing`, () =>
        HttpResponse.json({ code: 404, message: 'Fact table not found' }, { status: 404 }),
      ),
    );

    await sut(['data', 'fact-tables', 'get', 'factTables/missing', '--json']);

    expect(output.stderr).toContain('Fact table not found');
    expect(output.stdout).toBe('');
    expect(process.exitCode).toBe(1);
  });
});

describe('data fact-tables create', () => {
  it.each([undefined, 'purchases'])(
    'creates exactly one resource with optional ID %s and preserves the remote result',
    async (id) => {
      // Arrange
      using _auth = prepareAuthTokens('valid');
      using project = createProjectDir('empty');
      using output = captureOutput();
      const input = resource();
      const file = writeJsonFile(project.path, 'fact.json', input);
      const created: unknown[] = [];
      const urls: URL[] = [];
      const remote = {
        ...input,
        name: `factTables/${id ?? 'generated'}`,
        state: 'TABLE_STATE_CREATING',
        schemaValidationJob: 'sqlJobs/validation',
        creator: 'identities/me',
      };
      server.use(
        http.post(BASE, async ({ request }) => {
          created.push(await request.json());
          urls.push(new URL(request.url));
          return HttpResponse.json(remote);
        }),
      );

      // Act
      await sut([
        'data',
        'fact-tables',
        'create',
        '--from-file',
        file,
        ...(id ? ['--id', id] : []),
        '--json',
      ]);

      // Assert
      expect(created).toEqual([input]);
      expect(Object.fromEntries(urls[0].searchParams)).toEqual(id ? { factTableId: id } : {});
      expect(JSON.parse(output.stdout)).toEqual({ data: remote });
      expect(output.stderr).toBe('');
    },
  );

  it('uses the chosen profile token and its region rather than the default account', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using project = createProjectDir('empty');
    using output = captureOutput();
    const token = buildTestJwt({ 'https://confidence.dev/region': 'US' });
    const profileDir = `${process.env.CONFIDENCE_CONFIG_DIR}/profiles/analytics`;
    mkdirSync(profileDir, { recursive: true });
    writeJsonFile(profileDir, 'credentials.json', { accessToken: token });
    const file = writeJsonFile(project.path, 'fact.json', resource());
    const authorizations: (string | null)[] = [];
    server.use(
      http.post('https://metrics.us.confidence.dev/v1/factTables', ({ request }) => {
        authorizations.push(request.headers.get('Authorization'));
        return HttpResponse.json({ name: 'factTables/us-purchases' });
      }),
    );

    // Act
    await sut([
      'data',
      'fact-tables',
      'create',
      '--from-file',
      file,
      '--profile',
      'analytics',
      '--json',
    ]);

    // Assert
    expect(JSON.parse(output.stdout).data.name).toBe('factTables/us-purchases');
    expect(authorizations).toEqual([`Bearer ${token}`]);
  });

  it.each([
    { ...resource(), entities: [{ column: 'user_id', entity: 'entities/user' }] },
    { ...resource(), state: 'TABLE_STATE_ACTIVE' },
    { ...resource(), unknownOption: true },
    { ...resource(), skipSqlPreview: true },
    { ...resource(), measures: [{ column: { name: 'amount', type: 'COLUMN_TYPE_DOUBLE' } }] },
    {
      ...resource(),
      entities: [{ column: { name: 'user_id' }, entity: 'entities/user', extra: true }],
    },
    {
      ...resource(),
      dataDeliveredUntilUpdateStrategyConfig: {
        strategy: 'AUTOMATIC',
        automaticUpdateConfig: {
          commitDelay: '60s',
          changeThreshold: { value: '0.01', extra: true },
        },
      },
    },
  ])('rejects invalid resource input before authentication or HTTP: %j', async (input) => {
    using _auth = prepareAuthTokens('none');
    using project = createProjectDir('empty');
    using output = captureOutput();
    using requests = observeRequests();
    const file = writeJsonFile(project.path, 'fact.json', input);

    await sut(['data', 'fact-tables', 'create', '--from-file', file]);

    expect(output.stderr).not.toBe('');
    expect(output.stderr).not.toContain('Not logged in');
    expect(requests.requests).toEqual([]);
    expect(process.exitCode).toBe(1);
  });

  it('rejects malformed JSON without HTTP', async () => {
    using _auth = prepareAuthTokens('valid');
    using project = createProjectDir('empty');
    using output = captureOutput();
    using requests = observeRequests();
    const file = `${project.path}/fact.json`;
    writeFileSync(file, '{broken');

    await sut(['data', 'fact-tables', 'create', '--from-file', file]);

    expect(output.stderr).toContain('Cannot read fact table JSON');
    expect(requests.requests).toEqual([]);
    expect(process.exitCode).toBe(1);
  });

  it.each(['../escape', 'factTables/id', 'x?query=1', '%2f', 'a b'])(
    'rejects unsafe create ID %s',
    async (id) => {
      using _auth = prepareAuthTokens('valid');
      using project = createProjectDir('empty');
      using output = captureOutput();
      using requests = observeRequests();
      const file = writeJsonFile(project.path, 'fact.json', resource());

      await sut(['data', 'fact-tables', 'create', '--from-file', file, '--id', id]);

      expect(output.stderr).toContain('Resource name');
      expect(requests.requests).toEqual([]);
      expect(process.exitCode).toBe(1);
    },
  );

  it.each([400, 403, 409])('reports HTTP %s without retrying the create', async (status) => {
    using _auth = prepareAuthTokens('valid');
    using project = createProjectDir('empty');
    using output = captureOutput();
    using requests = observeRequests();
    const file = writeJsonFile(project.path, 'fact.json', resource());
    server.use(
      http.post(BASE, () =>
        HttpResponse.json({ code: status, message: 'Create rejected' }, { status }),
      ),
    );

    await sut(['data', 'fact-tables', 'create', '--from-file', file, '--json']);

    expect(output.stderr).toContain('Create rejected');
    expect(requests.requests).toHaveLength(1);
    expect(output.stdout).toBe('');
    expect(process.exitCode).toBe(1);
  });

  describe.each([undefined, 'purchases'])('malformed create response with ID %s', (id) => {
    it.each(malformedResources.map((data) => ({ data })))(
      'reports an unknown outcome for successful HTTP with malformed resource $data',
      async ({ data }) => {
        // Arrange
        using _auth = prepareAuthTokens('valid');
        using project = createProjectDir('empty');
        using output = captureOutput();
        using requests = observeRequests();
        const file = writeJsonFile(project.path, 'fact.json', resource());
        server.use(http.post(BASE, () => HttpResponse.json(data, { status: 201 })));

        // Act
        await sut([
          'data',
          'fact-tables',
          'create',
          '--from-file',
          file,
          ...(id === undefined ? [] : ['--id', id]),
          '--json',
        ]);

        // Assert
        expect(output.stderr).toContain('Create outcome is unknown');
        expect(output.stderr).toContain('no retry was attempted');
        expect(output.stderr).toContain(
          id === undefined ? 'Check fact-tables list/get' : 'fact-tables get factTables/purchases',
        );
        expect(requests.requests).toHaveLength(1);
        expect(output.stdout).toBe('');
        expect(process.exitCode).toBe(1);
      },
    );
  });

  it.each(['network', 'server', 'invalid response'])(
    'reports an unknown write outcome on %s failure without retrying',
    async (failure) => {
      using _auth = prepareAuthTokens('valid');
      using project = createProjectDir('empty');
      using output = captureOutput();
      using requests = observeRequests();
      const file = writeJsonFile(project.path, 'fact.json', resource());
      server.use(
        http.post(BASE, () =>
          failure === 'network'
            ? HttpResponse.error()
            : failure === 'server'
              ? HttpResponse.json({ message: 'Unavailable' }, { status: 503 })
              : HttpResponse.text('not JSON'),
        ),
      );

      await sut([
        'data',
        'fact-tables',
        'create',
        '--from-file',
        file,
        '--id',
        'purchases',
        '--json',
      ]);

      expect(output.stderr).toContain('Create outcome is unknown');
      expect(output.stderr).toContain('no retry was attempted');
      expect(output.stderr).toContain('fact-tables get factTables/purchases');
      expect(requests.requests).toHaveLength(1);
      expect(output.stdout).toBe('');
      expect(process.exitCode).toBe(1);
    },
  );
});

describe('fact table authentication and previews', () => {
  it.each(['list', 'get', 'create'])(
    'requires authentication for %s without sending HTTP',
    async (action) => {
      using _auth = prepareAuthTokens('none');
      using project = createProjectDir('empty');
      using output = captureOutput();
      using requests = observeRequests();
      const file = writeJsonFile(project.path, 'fact.json', resource());
      const args =
        action === 'create'
          ? ['--from-file', file]
          : action === 'get'
            ? ['factTables/purchases']
            : [];

      await sut(['data', 'fact-tables', action, ...args]);

      expect(output.stderr).toContain('Not logged in');
      expect(requests.requests).toEqual([]);
      expect(process.exitCode).toBe(1);
    },
  );

  it.each(['list', 'get', 'create'])(
    'previews validated %s without authentication or HTTP',
    async (action) => {
      // Arrange
      using _auth = prepareAuthTokens('none');
      using project = createProjectDir('empty');
      using output = captureOutput();
      using requests = observeRequests();
      const input = resource();
      const file = writeJsonFile(project.path, 'fact.json', input);
      const args =
        action === 'create'
          ? ['--from-file', file, '--id', 'purchases']
          : action === 'get'
            ? ['factTables/purchases']
            : ['--page-size', '5'];

      // Act
      await sut(['data', 'fact-tables', action, ...args, '--dry-run', '--json']);

      // Assert
      const preview = JSON.parse(output.stdout).data;
      expect(preview.method).toBe(action === 'create' ? 'POST' : 'GET');
      expect(preview.path).toBe(action === 'get' ? '/v1/factTables/purchases' : '/v1/factTables');
      if (action === 'create')
        expect(preview).toMatchObject({ params: { factTableId: 'purchases' }, body: input });
      expect(output.stderr).toBe('');
      expect(requests.requests).toEqual([]);
      expect(process.exitCode ?? 0).toBe(0);
    },
  );

  it.each([
    { ...resource(), state: 'TABLE_STATE_ACTIVE' },
    { ...resource(), dimensions: [{ name: 'product', extra: true }] },
  ])('still deeply validates dry-run resource input: %j', async (input) => {
    using _auth = prepareAuthTokens('none');
    using project = createProjectDir('empty');
    using output = captureOutput();
    using requests = observeRequests();
    const file = writeJsonFile(project.path, 'fact.json', input);

    await sut(['data', 'fact-tables', 'create', '--from-file', file, '--dry-run', '--json']);

    expect(output.stderr).toContain('is unsupported or output-only');
    expect(output.stdout).toBe('');
    expect(requests.requests).toEqual([]);
    expect(process.exitCode).toBe(1);
  });
});
