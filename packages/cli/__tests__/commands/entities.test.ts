import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { server, http, HttpResponse } from '@spotify-confidence/testing';
import { buildTestJwt, prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { dataCommand } from '@commands/data.js';
import { captureOutput } from '../helpers/capture.js';
import { createRunner } from '../helpers/run-command.js';

const EU_BASE = 'https://metrics.eu.confidence.dev';
const US_BASE = 'https://metrics.us.confidence.dev';
const sut = createRunner(dataCommand);
const entity = {
  name: 'entities/user_id',
  displayName: 'User',
  primaryKeyType: 'COLUMN_TYPE_STRING',
  createTime: '2026-01-01T00:00:00Z',
  labels: { team: 'growth' },
  owner: 'identities/owner',
  futureField: { retained: true },
};

function writeTestCredentials(accessToken: string, profile?: string): void {
  const base = process.env.CONFIDENCE_CONFIG_DIR!;
  const dir = profile ? join(base, 'profiles', profile) : base;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'credentials.json'), JSON.stringify({ accessToken }), { mode: 0o600 });
}

function recordRequests(): Request[] {
  const requests: Request[] = [];
  server.use(
    http.all('*', ({ request }) => {
      requests.push(request);
      return HttpResponse.json({ message: 'Unexpected request' }, { status: 500 });
    }),
  );
  return requests;
}

describe('data entities list', () => {
  it('returns one page with the cursor and complete entity resources by default', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    const requests: URL[] = [];
    server.use(
      http.get(`${EU_BASE}/v1/entities`, ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json({ entities: [entity], nextPageToken: 'next-page' });
      }),
    );

    await sut(['data', 'entities', 'list', '--json']);

    // Assert
    expect(JSON.parse(output.stdout).data).toEqual({
      entities: [entity],
      nextPageToken: 'next-page',
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]!.search).toBe('');
  });

  it.each([
    ['EU', EU_BASE, undefined],
    ['US', US_BASE, undefined],
    ['US', US_BASE, 'analytics'],
  ])('uses %s regional credentials at %s with profile %s', async (region, base, profile) => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    const token = buildTestJwt({ 'https://confidence.dev/region': region });
    writeTestCredentials(token, profile);
    server.use(
      http.get(`${base}/v1/entities`, ({ request }) => {
        if (request.headers.get('Authorization') !== `Bearer ${token}`) {
          return HttpResponse.json({ message: 'Wrong credentials' }, { status: 401 });
        }
        return HttpResponse.json({ entities: [entity] });
      }),
    );

    await sut(['data', 'entities', 'list', '--json', ...(profile ? ['--profile', profile] : [])]);

    expect(JSON.parse(output.stdout).data.entities).toEqual([entity]);
    expect(output.stderr).toBe('');
  });

  it('preserves unknown list response fields alongside complete entity resources', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    const response = { entities: [entity], nextPageToken: 'later', futurePageField: { count: 4 } };
    server.use(http.get(`${EU_BASE}/v1/entities`, () => HttpResponse.json(response)));

    await sut(['data', 'entities', 'list', '--json']);

    expect(JSON.parse(output.stdout).data).toEqual(response);
  });

  it('passes page size and opaque page token to the actual GET request', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    const cursors: string[] = [];
    server.use(
      http.get(`${EU_BASE}/v1/entities`, ({ request }) => {
        const url = new URL(request.url);
        cursors.push(`${url.searchParams.get('pageSize')}:${url.searchParams.get('pageToken')}`);
        return HttpResponse.json({ entities: [entity], nextPageToken: 'later' });
      }),
    );

    await sut([
      'data',
      'entities',
      'list',
      '--page-size',
      '1000',
      '--page-token',
      'a+/=?& b',
      '--json',
    ]);

    expect(cursors).toEqual(['1000:a+/=?& b']);
    expect(JSON.parse(output.stdout).data.nextPageToken).toBe('later');
  });

  it.each([{ entities: [] }, {}])('normalizes empty proto lists: %j', async (response) => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(http.get(`${EU_BASE}/v1/entities`, () => HttpResponse.json(response)));

    await sut(['data', 'entities', 'list', '--json']);

    expect(JSON.parse(output.stdout).data).toEqual({ entities: [], nextPageToken: '' });
  });

  it('renders entity resources and the next-page cursor in table output', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${EU_BASE}/v1/entities`, () =>
        HttpResponse.json({ entities: [entity], nextPageToken: 'next-page' }),
      ),
    );

    await sut(['data', 'entities', 'list', '--output', 'table']);

    expect(output.stdout).toContain('entities/user_id');
    expect(output.stdout).toContain('next-page');
  });

  it('collects all remaining pages while preserving page size and the starting token', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    const requests: string[] = [];
    const second = { ...entity, name: 'entities/account_id' };
    server.use(
      http.get(`${EU_BASE}/v1/entities`, ({ request }) => {
        const url = new URL(request.url);
        const cursor = url.searchParams.get('pageToken');
        requests.push(`${url.searchParams.get('pageSize')}:${cursor}`);
        if (cursor === 'start') {
          return HttpResponse.json({
            entities: [entity],
            nextPageToken: 'middle',
            firstPageField: { retained: true },
            futurePageField: 'first',
          });
        }
        if (cursor === 'middle') {
          return HttpResponse.json({ nextPageToken: 'end' });
        }
        return HttpResponse.json({
          entities: [second],
          finalPageField: { retained: true },
          futurePageField: 'last',
        });
      }),
    );

    await sut([
      'data',
      'entities',
      'list',
      '--all',
      '--page-size',
      '2',
      '--page-token',
      'start',
      '--json',
    ]);

    expect(requests).toEqual(['2:start', '2:middle', '2:end']);
    expect(JSON.parse(output.stdout).data).toEqual({
      entities: [entity, second],
      nextPageToken: '',
      firstPageField: { retained: true },
      finalPageField: { retained: true },
      futurePageField: 'last',
    });
  });

  it.each([undefined, 'start'])(
    'stops repeated cursors from start %s without partial output',
    async (start) => {
      // Arrange
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      let requests = 0;
      server.use(
        http.get(`${EU_BASE}/v1/entities`, () => {
          requests++;
          return HttpResponse.json({ entities: [entity], nextPageToken: start ?? 'repeat' });
        }),
      );

      await sut([
        'data',
        'entities',
        'list',
        '--all',
        '--json',
        ...(start ? ['--page-token', start] : []),
      ]);

      // Assert
      expect(requests).toBe(start ? 1 : 2);
      expect(output.stdout).toBe('');
      expect(output.stderr).toContain('repeated page token');
      expect(process.exitCode).toBe(1);
    },
  );

  it('detects longer cursor cycles', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    let requests = 0;
    server.use(
      http.get(`${EU_BASE}/v1/entities`, () => {
        requests++;
        return HttpResponse.json({ nextPageToken: requests === 2 ? 'second' : 'first' });
      }),
    );

    await sut(['data', 'entities', 'list', '--all', '--json']);

    expect(requests).toBe(3);
    expect(output.stderr).toContain('repeated page token');
    expect(output.stdout).toBe('');
  });

  it('reports errors on later pages without printing partial results', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${EU_BASE}/v1/entities`, ({ request }) =>
        new URL(request.url).searchParams.has('pageToken')
          ? HttpResponse.json({ code: 7, message: 'Access denied' }, { status: 403 })
          : HttpResponse.json({ entities: [entity], nextPageToken: 'next' }),
      ),
    );

    await sut(['data', 'entities', 'list', '--all', '--json']);

    expect(output.stdout).toBe('');
    expect(output.stderr).toContain('Access denied');
    expect(process.exitCode).toBe(1);
  });

  it.each(['0', '-1', '1.5', '1001', 'NaN', 'Infinity'])(
    'rejects page size %s before authentication or requests',
    async (size) => {
      using _auth = prepareAuthTokens('none');
      using output = captureOutput();
      const requests = recordRequests();

      await sut(['data', 'entities', 'list', '--page-size', size, '--dry-run', '--json']);

      // Assert
      expect(output.stderr).toContain('--page-size must be a positive integer');
      expect(output.stderr).not.toContain('Not logged in');
      expect(output.stdout).toBe('');
      expect(requests).toHaveLength(0);
      expect(process.exitCode).toBe(1);
    },
  );

  it('rejects repeated page-token options instead of coercing them', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    const requests = recordRequests();

    await sut(['data', 'entities', 'list', '--page-token', 'a', '--page-token', 'b', '--dry-run']);

    expect(output.stderr).toContain('--page-token must be a string');
    expect(output.stdout).toBe('');
    expect(requests).toHaveLength(0);
  });

  it('previews list pagination without authentication or any requests', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    const requests = recordRequests();

    await sut([
      'data',
      'entities',
      'list',
      '--all',
      '--page-size',
      '1',
      '--page-token',
      'opaque',
      '--dry-run',
      '--json',
    ]);

    // Assert
    expect(JSON.parse(output.stdout).data).toEqual({
      dryRun: true,
      method: 'GET',
      path: '/v1/entities',
      params: { pageSize: '1', pageToken: 'opaque' },
      all: true,
    });
    expect(output.stderr).toBe('');
    expect(requests).toHaveLength(0);
  });

  it.each(
    [
      null,
      [],
      { entities: null },
      { entities: {} },
      { entities: [null] },
      { entities: [{}] },
      { entities: [{ name: 42 }] },
      { entities: [{ name: 'flags/wrong' }] },
      { nextPageToken: 42 },
      { nextPageToken: null },
    ].map((response) => [response]),
  )('reports malformed list response %j instead of success', async (response) => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(http.get(`${EU_BASE}/v1/entities`, () => HttpResponse.json(response)));

    await sut(['data', 'entities', 'list', '--json']);

    expect(output.stdout).toBe('');
    expect(output.stderr).not.toBe('');
    expect(process.exitCode).toBe(1);
  });
});

describe('data entities get', () => {
  it('prints the complete resource returned by the Metrics API', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(http.get(`${EU_BASE}/v1/entities/user_id`, () => HttpResponse.json(entity)));

    await sut(['data', 'entities', 'get', '--name', 'entities/user_id', '--json']);

    expect(JSON.parse(output.stdout).data).toEqual(entity);
  });

  it('uses the selected US profile rather than the default EU credentials', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    const token = buildTestJwt({ 'https://confidence.dev/region': 'US', email: 'us@example.com' });
    writeTestCredentials(token, 'us');
    server.use(
      http.get(`${US_BASE}/v1/entities/user_id`, ({ request }) =>
        request.headers.get('Authorization') === `Bearer ${token}`
          ? HttpResponse.json(entity)
          : HttpResponse.json({ message: 'Wrong credentials' }, { status: 401 }),
      ),
    );

    await sut([
      'data',
      'entities',
      'get',
      '--name',
      'entities/user_id',
      '--profile',
      'us',
      '--json',
    ]);

    expect(JSON.parse(output.stdout).data).toEqual(entity);
    expect(output.stderr).toBe('');
  });

  it('rejects a different entity instead of reporting a successful get', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${EU_BASE}/v1/entities/user_id`, () =>
        HttpResponse.json({ ...entity, name: 'entities/account_id' }),
      ),
    );

    await sut(['data', 'entities', 'get', '--name', 'entities/user_id', '--json']);

    // Assert
    expect(output.stdout).toBe('');
    expect(output.stderr).toContain(
      'Entity response name does not match the requested resource name',
    );
    expect(process.exitCode).toBe(1);
  });

  it('reports entity not found', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${EU_BASE}/v1/entities/missing`, () =>
        HttpResponse.json({ code: 5, message: 'Entity not found' }, { status: 404 }),
      ),
    );

    await sut(['data', 'entities', 'get', '--name', 'entities/missing', '--json']);

    expect(output.stderr).toContain('Entity not found');
    expect(output.stdout).toBe('');
    expect(process.exitCode).toBe(1);
  });

  it.each([
    'user_id',
    'entities/',
    'flags/user_id',
    'entities/a/b',
    'entities/../user_id',
    'entities/a%2Fb',
    'entities/a?query',
    'entities/a#fragment',
    'entities/a\\b',
    'entities/a b',
    'https://metrics.eu.confidence.dev/v1/entities/user_id',
  ])('rejects invalid qualified name %s even in dry-run', async (name) => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    const requests = recordRequests();

    await sut(['data', 'entities', 'get', '--name', name, '--dry-run', '--json']);

    // Assert
    expect(output.stderr).toContain('Resource name must be entities/<id>');
    expect(output.stderr).not.toContain('Not logged in');
    expect(output.stdout).toBe('');
    expect(requests).toHaveLength(0);
    expect(process.exitCode).toBe(1);
  });

  it('previews the qualified GET path without authentication or requests', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    const requests = recordRequests();

    await sut(['data', 'entities', 'get', '--name', 'entities/user_id', '--dry-run', '--json']);

    // Assert
    expect(JSON.parse(output.stdout).data).toEqual({
      dryRun: true,
      method: 'GET',
      path: '/v1/entities/user_id',
    });
    expect(output.stderr).toBe('');
    expect(requests).toHaveLength(0);
  });

  it.each([null, [], {}, { name: 42 }, { name: 'entities/a/b' }].map((response) => [response]))(
    'rejects malformed entity response %j',
    async (response) => {
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      server.use(http.get(`${EU_BASE}/v1/entities/user_id`, () => HttpResponse.json(response)));

      await sut(['data', 'entities', 'get', '--name', 'entities/user_id', '--json']);

      expect(output.stdout).toBe('');
      expect(output.stderr).not.toBe('');
      expect(process.exitCode).toBe(1);
    },
  );
});

describe('data entities authentication', () => {
  it.each([['list'], ['get', '--name', 'entities/user_id']])(
    'requires authentication for %s without making requests',
    async (...args) => {
      using _auth = prepareAuthTokens('none');
      using output = captureOutput();
      const requests = recordRequests();

      await sut(['data', 'entities', ...args, '--json']);

      expect(output.stderr).toContain('Not logged in');
      expect(output.stdout).toBe('');
      expect(requests).toHaveLength(0);
      expect(process.exitCode).toBe(1);
    },
  );
});
