import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import yargs from 'yargs';

import { http, HttpResponse, server } from '@spotify-confidence/testing';
import { buildTestJwt, prepareAuthTokens } from '@spotify-confidence/testing/auth';

import { warehouseCommand } from '@commands/warehouse.js';

import { captureOutput } from '../helpers/capture.js';
import { createRunner } from '../helpers/run-command.js';

const METRICS_EU = 'https://metrics.eu.confidence.dev/v1/dataWarehouses';
const sut = createRunner(warehouseCommand);
const warehouse = {
  name: 'dataWarehouses/analytics',
  createTime: '2026-01-01T00:00:00Z',
  updateTime: '2026-02-01T00:00:00Z',
  creator: 'identities/alice',
  updater: 'identities/bob',
  owner: 'identities/team',
  labels: { environment: 'production' },
  limits: { maxConcurrentQueries: '10' },
  config: {
    bigQueryConfig: { gcpProjectId: 'project', dataset: 'confidence', bigQueryLocation: 'EU' },
  },
  futureMetadata: { state: 'READY' },
};

function simulateOutputTTY(isTTY: boolean): Disposable {
  const original = process.stdout.isTTY;
  process.stdout.isTTY = isTTY;
  return {
    [Symbol.dispose]() {
      process.stdout.isTTY = original;
    },
  };
}

afterEach(() => vi.unstubAllEnvs());

describe('warehouse list/get output', () => {
  it('prints one page with its continuation token and all public metadata in the JSON envelope', async () => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    const page = { dataWarehouses: [warehouse], nextPageToken: 'next', totalSize: 12 };
    server.use(http.get(METRICS_EU, () => HttpResponse.json(page)));

    await sut(['warehouse', 'list', '--json']);

    expect(JSON.parse(output.stdout)).toEqual({ data: page });
    expect(output.stderr).toBe('');
  });

  it('prints warehouse details with --output json', async () => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    server.use(http.get(`${METRICS_EU}/analytics`, () => HttpResponse.json(warehouse)));

    await sut(['warehouse', 'get', '--name', warehouse.name, '--output', 'json']);

    expect(JSON.parse(output.stdout)).toEqual({ data: warehouse });
  });

  it.each([['list'], ['get', '--name', warehouse.name]])(
    'renders public details in table output for %j',
    async (...args) => {
      // Arrange
      using _auth = prepareAuthTokens();
      using output = captureOutput();
      server.use(
        http.get(METRICS_EU, () => HttpResponse.json({ dataWarehouses: [warehouse] })),
        http.get(`${METRICS_EU}/analytics`, () => HttpResponse.json(warehouse)),
      );

      await sut(['warehouse', ...args, '--output', 'table']);

      // Assert
      expect(output.stdout).toContain(warehouse.name);
      expect(output.stdout).toContain('project');
      expect(output.stdout).toContain('production');
      expect(output.stdout).toContain('Field');
    },
  );

  it.each([
    { args: [], tty: false },
    { args: ['--json', '--output', 'table'], tty: true },
  ])('uses JSON when piped or explicitly requested: $args', async ({ args, tty }) => {
    // Arrange
    using _auth = prepareAuthTokens();
    using _tty = simulateOutputTTY(tty);
    using output = captureOutput();
    server.use(http.get(METRICS_EU, () => HttpResponse.json({ dataWarehouses: [] })));

    await sut(['warehouse', 'list', ...args]);

    expect(JSON.parse(output.stdout)).toEqual({ data: { dataWarehouses: [] } });
  });
});

describe('warehouse read authentication and routing', () => {
  it.each(['EU', 'US'])('uses the %s Metrics API and bearer authentication', async (region) => {
    // Arrange
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    const token = buildTestJwt({ 'https://confidence.dev/region': region });
    vi.stubEnv('CONFIDENCE_TOKEN', token);
    server.use(
      http.get(
        `https://metrics.${region.toLowerCase()}.confidence.dev/v1/dataWarehouses`,
        ({ request }) =>
          HttpResponse.json({
            dataWarehouses: [],
            authorized: request.headers.get('Authorization') === `Bearer ${token}`,
          }),
      ),
    );

    await sut(['warehouse', 'list', '--json']);

    expect(JSON.parse(output.stdout).data.authorized).toBe(true);
  });

  it.each([['list'], ['get', '--name', warehouse.name]])(
    'uses a named profile for %j rather than the default token',
    async (...args) => {
      // Arrange
      using _auth = prepareAuthTokens();
      using output = captureOutput();
      const token = buildTestJwt({ 'https://confidence.dev/region': 'US' });
      const profileDir = join(process.env.CONFIDENCE_CONFIG_DIR!, 'profiles', 'production');
      mkdirSync(profileDir, { recursive: true });
      writeFileSync(join(profileDir, 'credentials.json'), JSON.stringify({ accessToken: token }));
      server.use(
        http.get('https://metrics.us.confidence.dev/v1/dataWarehouses', ({ request }) =>
          HttpResponse.json({
            dataWarehouses: [],
            authorized: request.headers.get('Authorization') === `Bearer ${token}`,
          }),
        ),
        http.get('https://metrics.us.confidence.dev/v1/dataWarehouses/analytics', ({ request }) =>
          HttpResponse.json({
            ...warehouse,
            authorized: request.headers.get('Authorization') === `Bearer ${token}`,
          }),
        ),
      );

      await sut(['warehouse', ...args, '--profile', 'production', '--json']);

      expect(JSON.parse(output.stdout).data.authorized).toBe(true);
    },
  );

  it('honors the API base URL override', async () => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    vi.stubEnv('CONFIDENCE_API_BASE_URL', 'http://localhost:9876');
    server.use(
      http.get('http://localhost:9876/v1/dataWarehouses/analytics', () =>
        HttpResponse.json(warehouse),
      ),
    );

    await sut(['warehouse', 'get', '--name', warehouse.name, '--json']);

    expect(JSON.parse(output.stdout).data.name).toBe(warehouse.name);
  });

  it.each(['none', 'expired'] as const)(
    'fails without HTTP access when authentication is %s',
    async (auth) => {
      // Arrange
      using _auth = prepareAuthTokens(auth);
      using output = captureOutput();
      let requests = 0;
      server.use(
        http.get(`${METRICS_EU}*`, () => {
          requests++;
          return HttpResponse.json({});
        }),
      );

      await sut(['warehouse', 'list']);
      await sut(['warehouse', 'get', '--name', warehouse.name]);

      // Assert
      expect(output.stderr).toContain(auth === 'none' ? 'Not logged in' : 'Token expired');
      expect(process.exitCode).toBe(1);
      expect(requests).toBe(0);
      expect(output.stdout).toBe('');
    },
  );
});

describe('warehouse list pagination', () => {
  it('passes pageSize and opaque pageToken safely and stops after one page by default', async () => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    const pageToken = 'opaque+/=&? token';
    let requests = 0;
    server.use(
      http.get(METRICS_EU, ({ request }) => {
        requests++;
        return HttpResponse.json({
          dataWarehouses: [],
          nextPageToken: 'next',
          query: Object.fromEntries(new URL(request.url).searchParams),
        });
      }),
    );

    await sut(['warehouse', 'list', '--page-size', '1000', '--page-token', pageToken, '--json']);

    // Assert
    expect(JSON.parse(output.stdout).data).toEqual({
      dataWarehouses: [],
      nextPageToken: 'next',
      query: { pageSize: '1000', pageToken },
    });
    expect(requests).toBe(1);
  });

  it('only sends explicitly supplied pagination parameters', async () => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    server.use(
      http.get(METRICS_EU, ({ request }) =>
        HttpResponse.json({ dataWarehouses: [], query: new URL(request.url).search }),
      ),
    );

    await sut(['warehouse', 'list', '--json']);

    expect(JSON.parse(output.stdout).data.query).toBe('');
  });

  it('follows --all from a starting token, including an empty intermediate page', async () => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    const tokens: (string | null)[] = [];
    const sizes: (string | null)[] = [];
    server.use(
      http.get(METRICS_EU, ({ request }) => {
        const query = new URL(request.url).searchParams;
        tokens.push(query.get('pageToken'));
        sizes.push(query.get('pageSize'));
        if (query.get('pageToken') === 'start')
          return HttpResponse.json({
            dataWarehouses: [warehouse],
            nextPageToken: 'second',
            extra: 'retained',
            state: 'first',
          });
        if (query.get('pageToken') === 'second')
          return HttpResponse.json({ nextPageToken: 'last' });
        return HttpResponse.json({
          dataWarehouses: [{ name: 'dataWarehouses/last' }],
          state: 'last',
        });
      }),
    );

    // Act
    await sut([
      'warehouse',
      'list',
      '--all',
      '--page-token',
      'start',
      '--page-size',
      '1',
      '--json',
    ]);

    // Assert
    expect(JSON.parse(output.stdout).data).toEqual({
      dataWarehouses: [warehouse, { name: 'dataWarehouses/last' }],
      nextPageToken: '',
      extra: 'retained',
      state: 'last',
    });
    expect(tokens).toEqual(['start', 'second', 'last']);
    expect(sizes).toEqual(['1', '1', '1']);
  });

  it.each([
    { args: [], body: {} },
    { args: ['--all'], body: { nextPageToken: '' } },
  ])(
    'normalizes omitted repeated fields in an empty protobuf JSON response: $args',
    async ({ args, body }) => {
      // Arrange
      using _auth = prepareAuthTokens();
      using output = captureOutput();
      server.use(http.get(METRICS_EU, () => HttpResponse.json(body)));

      await sut(['warehouse', 'list', ...args, '--json']);

      // Assert
      expect(JSON.parse(output.stdout)).toEqual({ data: { ...body, dataWarehouses: [] } });
      expect(output.stderr).toBe('');
    },
  );

  it('supports --all on an empty warehouse list', async () => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    server.use(
      http.get(METRICS_EU, () => HttpResponse.json({ dataWarehouses: [], nextPageToken: '' })),
    );

    await sut(['warehouse', 'list', '--all', '--json']);

    expect(JSON.parse(output.stdout).data).toEqual({ dataWarehouses: [], nextPageToken: '' });
  });

  it.each([
    { start: [], tokens: ['a', 'a'], calls: 2 },
    { start: [], tokens: ['a', 'b', 'a'], calls: 3 },
    { start: ['--page-token', 'a'], tokens: ['a'], calls: 1 },
  ])(
    'fails without partial output for a repeated pagination token: $tokens',
    async ({ start, tokens, calls }) => {
      // Arrange
      using _auth = prepareAuthTokens();
      using output = captureOutput();
      let requests = 0;
      server.use(
        http.get(METRICS_EU, () =>
          HttpResponse.json({
            dataWarehouses: [warehouse],
            nextPageToken: tokens[requests++] ?? '',
          }),
        ),
      );

      await sut(['warehouse', 'list', '--all', ...start, '--json']);

      // Assert
      expect(output.stderr).toContain('repeated page token');
      expect(process.exitCode).toBe(1);
      expect(output.stdout).toBe('');
      expect(requests).toBe(calls);
    },
  );

  it('bounds --all when the server never exhausts unique cursors', async () => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    let requests = 0;
    server.use(
      http.get(METRICS_EU, () =>
        HttpResponse.json({ dataWarehouses: [], nextPageToken: `page-${++requests}` }),
      ),
    );

    await sut(['warehouse', 'list', '--all', '--json']);

    // Assert
    expect(requests).toBe(1000);
    expect(output.stderr).toContain('1000-page safety limit');
    expect(process.exitCode).toBe(1);
    expect(output.stdout).toBe('');
  });

  it('does not print partial results when a later page fails', async () => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    server.use(
      http.get(METRICS_EU, ({ request }) =>
        new URL(request.url).searchParams.has('pageToken')
          ? HttpResponse.json(
              { code: 7, message: 'Permission denied on page two' },
              { status: 403 },
            )
          : HttpResponse.json({ dataWarehouses: [warehouse], nextPageToken: 'next' }),
      ),
    );

    await sut(['warehouse', 'list', '--all', '--json']);

    expect(output.stderr).toContain('Permission denied on page two');
    expect(process.exitCode).toBe(1);
    expect(output.stdout).toBe('');
  });
});

describe('warehouse read validation and dry-run', () => {
  it.each(['0', '-1', '1.5', '1001', 'NaN', 'Infinity', 'text'])(
    'rejects invalid --page-size %s before authentication, even in dry-run',
    async (size) => {
      using _auth = prepareAuthTokens('none');
      using output = captureOutput();

      await sut(['warehouse', 'list', '--page-size', size, '--dry-run']);

      // Assert
      expect(output.stderr).toContain('--page-size must be a positive integer');
      expect(output.stderr).not.toContain('Not logged in');
      expect(process.exitCode).toBe(1);
      expect(output.stdout).toBe('');
    },
  );

  it.each([
    'id',
    '/dataWarehouses/id',
    'other/id',
    'dataWarehouses/',
    'dataWarehouses/a/child',
    'dataWarehouses/..',
    'dataWarehouses/a%2fb',
    'dataWarehouses/a?x=y',
    'dataWarehouses/a#b',
    'dataWarehouses/a\\b',
    'dataWarehouses/a b',
    'dataWarehouses/a\n',
    'dataWarehouses/a\u001b[31m',
    'https://evil.example/dataWarehouses/id',
    '//evil.example/id',
  ])('rejects unsafe or unqualified name %s before authentication', async (name) => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await sut(['warehouse', 'get', '--name', name, '--dry-run']);

    // Assert
    expect(output.stderr).toContain('Resource name must be dataWarehouses/<id>');
    expect(output.stderr).not.toContain('Not logged in');
    expect(process.exitCode).toBe(1);
    expect(output.stdout).toBe('');
  });

  it.each([
    ['list', '--page-size', '1', '--page-size', '2'],
    ['list', '--page-token', 'a', '--page-token', 'b'],
    ['list', '--page-token', ''],
    ['list', '--page-token', '   '],
    ['get', '--name', warehouse.name, '--name', 'dataWarehouses/other'],
    ['get', '--name', ''],
  ])('rejects ambiguous duplicate or empty scalar arguments: %j', async (...args) => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await sut(['warehouse', ...args, '--dry-run']);

    expect(process.exitCode).toBe(1);
    expect(output.stdout).toBe('');
    expect(output.stderr).not.toContain('Not logged in');
  });

  it('requires --name and rejects unimplemented read flags', async () => {
    using _output = captureOutput();
    const parser = () => yargs().exitProcess(false).command(warehouseCommand);

    // Act / Assert
    await expect(async () => parser().parseAsync(['warehouse', 'get'])).rejects.toThrow(
      'Missing required argument: name',
    );
    await expect(async () =>
      parser().parseAsync(['warehouse', 'list', '--filter', 'x']),
    ).rejects.toThrow('Unknown argument: filter');
  });

  it.each([
    {
      args: ['list', '--all', '--page-size', '5', '--page-token', 'start'],
      preview: {
        dryRun: true,
        method: 'GET',
        path: '/v1/dataWarehouses',
        params: { pageSize: '5', pageToken: 'start' },
        all: true,
      },
    },
    {
      args: ['get', '--name', 'dataWarehouses/valid_ID-123'],
      preview: { dryRun: true, method: 'GET', path: '/v1/dataWarehouses/valid_ID-123' },
    },
  ])(
    'previews a validated request without authentication or HTTP: $args',
    async ({ args, preview }) => {
      // Arrange
      using _auth = prepareAuthTokens('none');
      using output = captureOutput();
      let requests = 0;
      server.use(
        http.get(`${METRICS_EU}*`, () => {
          requests++;
          return HttpResponse.json({});
        }),
      );

      await sut(['warehouse', ...args, '--dry-run', '--json']);

      expect(JSON.parse(output.stdout)).toEqual({ data: preview });
      expect(output.stderr).toBe('');
      expect(requests).toBe(0);
    },
  );
});

describe('warehouse read failures', () => {
  it.each([
    { action: ['list'], status: 403, message: 'Permission denied' },
    { action: ['get', '--name', warehouse.name], status: 403, message: 'Permission denied' },
    { action: ['get', '--name', warehouse.name], status: 404, message: 'Warehouse not found' },
    { action: ['list'], status: 500, message: 'Internal error' },
  ])(
    'reports HTTP $status for $action without printing response details',
    async ({ action, status, message }) => {
      // Arrange
      using _auth = prepareAuthTokens();
      using output = captureOutput();
      server.use(
        http.get(`${METRICS_EU}*`, () =>
          HttpResponse.json(
            { code: status, message, details: [{ clientSecret: 'details-secret-value' }] },
            { status },
          ),
        ),
      );

      await sut(['warehouse', ...action, '--json']);

      // Assert
      expect(output.stderr).toContain(message);
      expect(output.stderr).not.toContain('details-secret-value');
      expect(process.exitCode).toBe(1);
      expect(output.stdout).toBe('');
    },
  );

  it('redacts bearer credentials and terminal controls from API errors', async () => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    const credential = 'synthetic-bearer-credential';
    server.use(
      http.get(METRICS_EU, () =>
        HttpResponse.json(
          { code: 7, message: `Denied\n\u001b[31m Bearer ${credential}` },
          { status: 403 },
        ),
      ),
    );

    await sut(['warehouse', 'list', '--json']);

    // Assert
    expect(output.stderr).toContain('Denied');
    expect(output.stderr).not.toContain(credential);
    expect(output.stderr).not.toContain('\u001b');
    expect(process.exitCode).toBe(1);
    expect(output.stdout).toBe('');
  });

  it('reports network failures', async () => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    server.use(http.get(METRICS_EU, () => HttpResponse.error()));

    await sut(['warehouse', 'list']);

    expect(output.stderr).toContain('Network error');
    expect(process.exitCode).toBe(1);
  });

  it.each(
    [
      null,
      [],
      'unexpected',
      { dataWarehouses: null },
      { dataWarehouses: {} },
      { dataWarehouses: [null] },
      { dataWarehouses: [{ name: 'other/id' }] },
      { dataWarehouses: [], nextPageToken: 7 },
      { dataWarehouses: [{ name: warehouse.name, config: [] }] },
      { dataWarehouses: [{ name: warehouse.name, config: { bigQueryConfig: { dataset: 1 } } }] },
    ].map((body) => ({ body })),
  )('fails in a controlled way on malformed list response $body', async ({ body }) => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    server.use(http.get(METRICS_EU, () => HttpResponse.json(body)));

    await sut(['warehouse', 'list', '--json']);

    expect(process.exitCode).toBe(1);
    expect(output.stderr.length).toBeGreaterThan(0);
    expect(output.stdout).toBe('');
  });

  it.each(
    [
      null,
      [],
      {},
      { name: 123 },
      { name: 'other/id' },
      { name: warehouse.name, config: { dataBricksConfig: 'raw-secret' } },
      { name: warehouse.name, config: { redshiftConfig: { credentialsSettings: [] } } },
      { name: warehouse.name, config: { redshiftConfig: { webIdentitySettings: 'raw-secret' } } },
    ].map((body) => ({ body })),
  )('fails in a controlled way on malformed get response $body', async ({ body }) => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    server.use(http.get(`${METRICS_EU}/analytics`, () => HttpResponse.json(body)));

    await sut(['warehouse', 'get', '--name', warehouse.name, '--json']);

    expect(process.exitCode).toBe(1);
    expect(output.stderr.length).toBeGreaterThan(0);
    expect(output.stderr).not.toContain('raw-secret');
    expect(output.stdout).toBe('');
  });

  it('rejects a get response for a different valid warehouse name', async () => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    server.use(
      http.get(`${METRICS_EU}/analytics`, () =>
        HttpResponse.json({ ...warehouse, name: 'dataWarehouses/other' }),
      ),
    );

    await sut(['warehouse', 'get', '--name', warehouse.name, '--json']);

    // Assert
    expect(output.stderr).toContain('does not match the requested resource');
    expect(process.exitCode).toBe(1);
    expect(output.stdout).toBe('');
  });

  it('reports non-JSON responses without printing raw response bodies', async () => {
    // Arrange
    using _auth = prepareAuthTokens();
    using output = captureOutput();
    server.use(http.get(METRICS_EU, () => HttpResponse.text('<html>not JSON</html>')));

    await sut(['warehouse', 'list']);

    expect(process.exitCode).toBe(1);
    expect(output.stdout).toBe('');
  });
});

describe('warehouse read credential redaction', () => {
  const config = {
    dataBricksConfig: {
      host: 'https://databricks.example',
      clientId: 'public-client',
      clientSecret: 'databricks-secret-value',
      futureCredentials: { password: 'future-secret-value' },
    },
    redshiftConfig: {
      roleArn: 'arn:aws:iam::123:role/confidence',
      database: 'analytics',
      credentialsSettings: {
        accessKeyId: 'public-access-key-id',
        secretAccessKey: 'aws-secret-value',
        sessionToken: 'session-secret-value',
      },
    },
    snowflakeConfig: {
      account: 'snowflake-account',
      authenticationKey: 'cryptoKeys/warehouse',
      privateKey: 'private-key-secret-value',
    },
    bigQueryConfig: {
      serviceAccount: 'confidence@example.iam.gserviceaccount.com',
      serviceAccountKey: 'service-account-secret-value',
    },
    unknownConfig: { token: 'unknown-secret-value' },
  };
  const safeConfig = {
    dataBricksConfig: { host: 'https://databricks.example', clientId: 'public-client' },
    redshiftConfig: {
      roleArn: 'arn:aws:iam::123:role/confidence',
      database: 'analytics',
      credentialsSettings: { accessKeyId: 'public-access-key-id' },
    },
    snowflakeConfig: { account: 'snowflake-account', authenticationKey: 'cryptoKeys/warehouse' },
    bigQueryConfig: { serviceAccount: 'confidence@example.iam.gserviceaccount.com' },
  };

  it.each([
    { args: ['list'], format: ['--json'] },
    { args: ['list', '--all'], format: ['--output', 'table'] },
    { args: ['get', '--name', warehouse.name], format: ['--json'] },
    { args: ['get', '--name', warehouse.name], format: ['--output', 'table'] },
  ])(
    'omits credentials but retains public metadata for $args $format',
    async ({ args, format }) => {
      // Arrange
      using _auth = prepareAuthTokens();
      using output = captureOutput();
      server.use(
        http.get(METRICS_EU, () =>
          HttpResponse.json({ dataWarehouses: [{ ...warehouse, config }] }),
        ),
        http.get(`${METRICS_EU}/analytics`, () => HttpResponse.json({ ...warehouse, config })),
      );

      await sut(['warehouse', ...args, ...format]);

      // Assert
      for (const secret of [
        'databricks-secret-value',
        'future-secret-value',
        'aws-secret-value',
        'session-secret-value',
        'private-key-secret-value',
        'service-account-secret-value',
        'unknown-secret-value',
      ]) {
        expect(output.stdout + output.stderr).not.toContain(secret);
      }
      expect(output.stdout).toContain('cryptoKeys/warehouse');
      expect(output.stdout).toContain('public-client');
      expect(output.stdout).toContain('production');
      if (format.includes('--json')) {
        const data = JSON.parse(output.stdout).data;
        expect(args[0] === 'list' ? data.dataWarehouses[0] : data).toEqual({
          ...warehouse,
          config: safeConfig,
        });
      }
    },
  );
});
