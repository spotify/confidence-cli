import { http, HttpResponse, server } from '@spotify-confidence/testing';
import { buildTestJwt } from '@spotify-confidence/testing/auth';
import { metricsRequest } from '@network/metrics.js';
import { isRecord, requireRecord, requireString, resourcePath } from '@network/metrics-types.js';

afterEach(() => vi.unstubAllEnvs());

describe('Metrics requests', () => {
  it.each(['EU', 'US'])('routes to %s and authenticates the request', async (region) => {
    const token = buildTestJwt({ 'https://confidence.dev/region': region });
    server.use(
      http.get(
        `https://metrics.${region.toLowerCase()}.confidence.dev/v1/testResources`,
        ({ request }) =>
          HttpResponse.json({
            authorized: request.headers.get('Authorization') === `Bearer ${token}`,
          }),
      ),
    );
    const sut = metricsRequest;

    const result = await sut(token, { path: '/v1/testResources' });

    expect(result).toEqual({ ok: true, data: { authorized: true } });
  });

  it('honors the API base override and sends body and explicit pagination parameters', async () => {
    vi.stubEnv('CONFIDENCE_API_BASE_URL', 'http://localhost:9876');
    server.use(
      http.post('http://localhost:9876/v1/testResources', async ({ request }) =>
        HttpResponse.json({
          body: await request.json(),
          params: Object.fromEntries(new URL(request.url).searchParams),
        }),
      ),
    );
    const sut = metricsRequest;

    const result = await sut(buildTestJwt(), {
      path: '/v1/testResources',
      method: 'POST',
      body: { displayName: 'Example' },
      params: { page_size: '10', page_token: 'opaque?token/#' },
    });

    expect(result).toEqual({
      ok: true,
      data: {
        body: { displayName: 'Example' },
        params: { page_size: '10', page_token: 'opaque?token/#' },
      },
    });
  });

  it('preserves structured failures without retrying writes', async () => {
    let calls = 0;
    const error = { code: 3, message: 'Invalid input', details: [{ field: 'name' }] };
    server.use(
      http.post('https://metrics.eu.confidence.dev/v1/testResources', () => {
        calls++;
        return HttpResponse.json(error, { status: 400 });
      }),
    );
    const sut = metricsRequest;

    const result = await sut(buildTestJwt(), { path: '/v1/testResources', method: 'POST' });

    expect(result).toEqual({ ok: false, status: 400, error });
    expect(calls).toBe(1);
  });

  it('does not replay a redirected write or send credentials to its location', async () => {
    let redirectedCalls = 0;
    server.use(
      http.post(
        'https://metrics.eu.confidence.dev/v1/testResources',
        () =>
          new HttpResponse(null, {
            status: 307,
            headers: { Location: 'https://metrics.eu.confidence.dev/v1/redirected' },
          }),
      ),
      http.post('https://metrics.eu.confidence.dev/v1/redirected', () => {
        redirectedCalls++;
        return HttpResponse.json({});
      }),
    );
    const sut = metricsRequest;

    const result = await sut(buildTestJwt(), {
      path: '/v1/testResources',
      method: 'POST',
      body: { displayName: 'Example' },
    });

    expect(result).toMatchObject({ ok: false, status: 0 });
    expect(redirectedCalls).toBe(0);
  });

  it('passes cancellation through to the HTTP client', async () => {
    const sut = metricsRequest;

    const result = await sut(buildTestJwt(), {
      path: '/v1/testResources',
      signal: AbortSignal.abort(),
      timeoutMs: 100,
    });

    expect(result).toMatchObject({ ok: false, status: 0 });
  });

  it.each([
    'https://other.example/v1/testResources',
    '//other.example/v1/testResources',
    '/v1/../admin',
    '/v1/%2e%2e/admin',
    '/v1/testResources?secret=value',
    '/v1/testResources#fragment',
    '/v1/\\other.example',
  ])('rejects unsafe API path %s before sending', async (path) => {
    const sut = metricsRequest;
    await expect(sut(buildTestJwt(), { path })).rejects.toThrow('local /v1/ API path');
  });
});

describe('resource paths', () => {
  it('builds a path from a qualified resource with exactly one ID', () => {
    const sut = resourcePath;
    expect(sut('testResources/abc-123_A', 'testResources')).toBe('/v1/testResources/abc-123_A');
  });

  it.each([
    '',
    'abc',
    '/testResources/abc',
    'https://evil.example/testResources/abc',
    '//evil.example/testResources/abc',
    'other/abc',
    'testResources/',
    'testResources/.',
    'testResources/..',
    'testResources/../other',
    'testResources/abc/child',
    'testResources/%2e%2e',
    'testResources/%252fadmin',
    'testResources/a%2fb',
    'testResources/a?query=x',
    'testResources/a#fragment',
    'testResources/a\\b',
    'testResources/a b',
    'testResources/abc\n',
  ])('rejects invalid resource name %j', (name) => {
    const sut = resourcePath;
    expect(() => sut(name, 'testResources')).toThrow('single valid ID');
  });

  it.each(['../testResources', '/testResources', 'testResources/child', 'testResources?x=y'])(
    'rejects invalid collection %s',
    (collection) => {
      const sut = resourcePath;
      expect(() => sut('testResources/abc', collection)).toThrow('Invalid resource collection');
    },
  );
});

describe('response guards', () => {
  it.each([null, [], 'text', 42, undefined].map((value) => ({ value })))(
    'rejects non-record value $value',
    ({ value }) => {
      const sut = requireRecord;
      expect(isRecord(value)).toBe(false);
      expect(() => sut(value, 'Response')).toThrow('Response must be an object');
    },
  );

  it('preserves resource fields rather than discarding unknown ones', () => {
    const resource = { name: 'testResources/a', state: 'FAILED', extra: { reason: 'example' } };
    const sut = requireRecord;
    expect(sut(resource)).toBe(resource);
  });

  it.each(['', '  ', null, [], 42].map((value) => ({ value })))(
    'rejects empty or non-string value $value',
    ({ value }) => {
      const sut = requireString;
      expect(() => sut(value, 'Name')).toThrow('Name must be a non-empty string');
    },
  );

  it('does not silently rewrite strings', () => {
    const sut = requireString;
    expect(sut('  original  ')).toBe('  original  ');
  });
});
