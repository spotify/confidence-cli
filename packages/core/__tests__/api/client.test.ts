import { http, HttpResponse, server } from '@spotify-confidence/testing';
import { resolveBaseUrl, apiRequest } from '@api/client.js';

const TEST_BASE = 'https://test-svc.eu.confidence.dev';

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
