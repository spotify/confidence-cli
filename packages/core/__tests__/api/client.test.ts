import { http, HttpResponse, server } from '@spotify-confidence/testing';
import { resolveBaseUrl, apiRequest } from '@api/client.js';
import type { ApiRequestOptions } from '@api/types.js';

const TEST_BASE = 'https://test-svc.eu.confidence.dev';
const requestOptions: ApiRequestOptions = {
  token: 'test-token',
  region: 'EU',
  service: 'test-svc',
  path: '/v1/items',
};

beforeEach(() => {
  server.use(
    http.get(`${TEST_BASE}/v1/items`, (info) => {
      const url = new URL(info.request.url);
      return HttpResponse.json({
        auth: info.request.headers.get('Authorization'),
        params: Object.fromEntries(url.searchParams),
      });
    }),

    http.post(`${TEST_BASE}/v1/items`, async (info) => {
      const body = await info.request.json();
      return HttpResponse.json({ body });
    }),

    http.get(`${TEST_BASE}/v1/items/missing`, () => {
      return HttpResponse.json({ code: 404, message: 'Not Found' }, { status: 404 });
    }),

    http.get(`${TEST_BASE}/v1/items/error`, () => {
      return HttpResponse.error();
    }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveBaseUrl', () => {
  it('returns an EU regional URL', () => {
    const sut = resolveBaseUrl;

    expect(sut('events', 'EU')).toBe('https://events.eu.confidence.dev');
  });

  it('returns a US regional URL', () => {
    const sut = resolveBaseUrl;

    expect(sut('events', 'US')).toBe('https://events.us.confidence.dev');
  });

  it('respects CONFIDENCE_API_BASE_URL override', () => {
    vi.stubEnv('CONFIDENCE_API_BASE_URL', 'http://localhost:9999');

    const sut = resolveBaseUrl;

    expect(sut('events', 'EU')).toBe('http://localhost:9999');
  });
});

describe('apiRequest response safety', () => {
  it.each(['not JSON', '', '<html>private upstream error</html>'])(
    'returns a controlled failure for malformed success body %j',
    async (body) => {
      server.use(http.get(`${TEST_BASE}/v1/items`, () => new HttpResponse(body)));
      const sut = apiRequest;

      const result = await sut(requestOptions);

      expect(result).toEqual({
        ok: false,
        status: 200,
        error: { code: 200, message: 'Invalid JSON response from API.' },
      });
    },
  );

  it.each(
    [null, [], 'error', { message: {} }, { code: 'bad', message: 'invalid' }].map((body) => ({
      body,
    })),
  )('normalizes malformed error response $body', async ({ body }) => {
    server.use(
      http.get(`${TEST_BASE}/v1/items`, () =>
        HttpResponse.json(body, { status: 503, statusText: 'Service Unavailable' }),
      ),
    );
    const sut = apiRequest;

    const result = await sut(requestOptions);

    expect(result).toEqual({
      ok: false,
      status: 503,
      error: { code: 503, message: 'Service Unavailable' },
    });
  });

  it('does not expose non-JSON error bodies', async () => {
    server.use(
      http.get(
        `${TEST_BASE}/v1/items`,
        () => new HttpResponse('<html>upstream private details</html>', { status: 502 }),
      ),
    );
    const sut = apiRequest;

    const result = await sut(requestOptions);

    expect(result).toEqual({
      ok: false,
      status: 502,
      error: { code: 502, message: 'Bad Gateway' },
    });
  });

  it('preserves structured API errors and details', async () => {
    const error = { code: 3, message: 'Invalid input', details: [{ field: 'name' }] };
    server.use(http.get(`${TEST_BASE}/v1/items`, () => HttpResponse.json(error, { status: 400 })));
    const sut = apiRequest;

    const result = await sut(requestOptions);

    expect(result).toEqual({ ok: false, status: 400, error });
  });

  it('discards malformed error details', async () => {
    server.use(
      http.get(`${TEST_BASE}/v1/items`, () =>
        HttpResponse.json({ code: 3, message: 'Invalid input', details: 'bad' }, { status: 400 }),
      ),
    );
    const sut = apiRequest;

    const result = await sut(requestOptions);

    expect(result).toEqual({
      ok: false,
      status: 400,
      error: { code: 3, message: 'Invalid input' },
    });
  });

  it('returns a controlled failure if reading the body fails', async () => {
    server.use(
      http.get(
        `${TEST_BASE}/v1/items`,
        () =>
          new HttpResponse(
            new ReadableStream({
              start(controller) {
                controller.error(new Error('Connection closed'));
              },
            }),
          ),
      ),
    );
    const sut = apiRequest;

    const result = await sut(requestOptions);

    expect(result).toMatchObject({ ok: false, status: 0, error: { code: 0 } });
    if (!result.ok) expect(result.error.message).toContain('Network error');
  });
});

describe('apiRequest cancellation', () => {
  it('honors an already cancelled caller signal', async () => {
    const sut = apiRequest;

    const result = await sut({ ...requestOptions, signal: AbortSignal.abort() });

    expect(result).toMatchObject({ ok: false, status: 0, error: { code: 0 } });
  });

  it.each(['timeout', 'caller'] as const)('cancels before headers via %s', async (mode) => {
    const controller = new AbortController();
    server.use(
      http.get(`${TEST_BASE}/v1/items`, async ({ request }) => {
        if (mode === 'caller') controller.abort();
        await new Promise<void>((resolve) => {
          if (request.signal.aborted) resolve();
          else request.signal.addEventListener('abort', () => resolve(), { once: true });
        });
        return HttpResponse.json({});
      }),
    );
    const sut = apiRequest;

    const result = await sut({
      ...requestOptions,
      signal: controller.signal,
      timeoutMs: mode === 'timeout' ? 50 : 1000,
    });

    expect(result).toMatchObject({ ok: false, status: 0, error: { code: 0 } });
  });

  it.each(['timeout', 'caller'] as const)('cancels body consumption via %s', async (mode) => {
    const controller = new AbortController();
    server.use(
      http.get(
        `${TEST_BASE}/v1/items`,
        ({ request }) =>
          new HttpResponse(
            new ReadableStream({
              start(body) {
                body.enqueue(new TextEncoder().encode('{'));
                request.signal.addEventListener('abort', () => body.error(request.signal.reason), {
                  once: true,
                });
                if (mode === 'caller') queueMicrotask(() => controller.abort());
              },
            }),
          ),
      ),
    );
    const sut = apiRequest;

    const result = await sut({
      ...requestOptions,
      signal: controller.signal,
      timeoutMs: mode === 'timeout' ? 50 : 1000,
    });

    expect(result).toMatchObject({ ok: false, status: 0, error: { code: 0 } });
  });
});

describe('apiRequest', () => {
  it('sends an authorized GET request', async () => {
    const result = await apiRequest<{ auth: string }>({
      token: 'test-token',
      region: 'EU',
      service: 'test-svc',
      path: '/v1/items',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.auth).toBe('Bearer test-token');
    }
  });

  it('sends query params', async () => {
    const result = await apiRequest<{ params: Record<string, string> }>({
      token: 'test-token',
      region: 'EU',
      service: 'test-svc',
      path: '/v1/items',
      params: { pageSize: '10', pageToken: 'abc' },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.params).toEqual({ pageSize: '10', pageToken: 'abc' });
    }
  });

  it('sends a POST request with body', async () => {
    const result = await apiRequest<{ body: Record<string, unknown> }>({
      token: 'test-token',
      region: 'EU',
      service: 'test-svc',
      path: '/v1/items',
      method: 'POST',
      body: { displayName: 'Test Resource' },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.body).toEqual({ displayName: 'Test Resource' });
    }
  });

  it('returns a typed failure on 4xx responses', async () => {
    const result = await apiRequest({
      token: 'test-token',
      region: 'EU',
      service: 'test-svc',
      path: '/v1/items/missing',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
      expect(result.error.message).toBe('Not Found');
    }
  });

  it('returns a failure on network errors', async () => {
    const result = await apiRequest({
      token: 'test-token',
      region: 'EU',
      service: 'test-svc',
      path: '/v1/items/error',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(0);
      expect(result.error.message).toMatch(/Network error/);
    }
  });
});
