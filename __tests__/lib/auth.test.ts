import { execFile } from 'node:child_process';
import { http, HttpResponse, passthrough } from 'msw';
import { server } from '../msw/server.js';
import { buildTestJwt, prepareAuthTokens } from '../shared/auth/index.js';
import { authenticate, AUTH_CALLBACK_PORT } from '@lib/auth.js';

// Isolate the token files in a dedicated temp directory so the real
// logins performed here don't leak tokens into test files that run in
// parallel workers and read the shared tmpdir. Must run before module
// imports because token paths are resolved at module load.
await vi.hoisted(async () => {
  const { mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  process.env['TMPDIR'] = mkdtempSync(join(tmpdir(), 'confidence-auth-test-'));
});

// Mocking the browser opener because it would launch a real browser.
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, execFile: vi.fn() };
});

const CALLBACK_URL = `http://localhost:${AUTH_CALLBACK_PORT}/callback`;

beforeEach(() => {
  server.use(http.get(CALLBACK_URL, () => passthrough()));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function useTokenHandler(claims: Record<string, unknown>) {
  server.use(
    http.post('https://auth.confidence.dev/oauth/token', () =>
      HttpResponse.json({
        access_token: buildTestJwt(claims),
        refresh_token: 'test-refresh-token',
        token_type: 'Bearer',
        expires_in: 86400,
      }),
    ),
  );
}

async function waitForOpenedUrl(): Promise<string> {
  const openedBrowsers = vi.mocked(execFile).mock.calls.length;
  await vi.waitFor(() =>
    expect(vi.mocked(execFile).mock.calls.length).toBeGreaterThan(openedBrowsers),
  );
  const [, args] = vi.mocked(execFile).mock.calls.at(-1) as unknown as [string, string[]];
  return args.find((arg) => arg.startsWith('http'))!;
}

async function hitCallback(query: string, init?: RequestInit): Promise<Response> {
  return vi.waitFor(() => fetch(`${CALLBACK_URL}${query}`, init));
}

async function completeAuth(mode: 'signup' | 'login'): Promise<string> {
  const result = authenticate(mode);
  const authUrl = await waitForOpenedUrl();
  await hitCallback('?code=test-code');
  await result;
  return authUrl;
}

describe('authenticate', () => {
  describe('when no workspace is remembered', () => {
    it('opens the authorize URL without an organization parameter', async () => {
      using _auth = prepareAuthTokens('none');
      useTokenHandler({ org_id: 'org_123' });
      const sut = completeAuth;

      const authUrl = await sut('login');

      expect(authUrl).not.toContain('organization=');
    });
  });

  describe('when a previous login succeeded', () => {
    it('remembers the org_id claim and passes it as organization on the next login', async () => {
      using _auth = prepareAuthTokens('none');
      useTokenHandler({ org_id: 'org_123' });
      const sut = completeAuth;

      await sut('login');
      const authUrl = await sut('login');

      expect(authUrl).toContain('organization=org_123');
    });

    it('falls back to the org_login_id claim when org_id is absent', async () => {
      using _auth = prepareAuthTokens('none');
      useTokenHandler({ 'https://confidence.dev/org_login_id': 'acme' });
      const sut = completeAuth;

      await sut('login');
      const authUrl = await sut('login');

      expect(authUrl).toContain('organization=acme');
    });

    it('prefers the CONFIDENCE_ORGANIZATION env var over the remembered workspace', async () => {
      using _auth = prepareAuthTokens('none');
      useTokenHandler({ org_id: 'org_remembered' });
      const sut = completeAuth;

      await sut('login');
      vi.stubEnv('CONFIDENCE_ORGANIZATION', 'org_override');
      const authUrl = await sut('login');

      expect(authUrl).toContain('organization=org_override');
    });

    it('never passes an organization in signup mode', async () => {
      using _auth = prepareAuthTokens('none');
      useTokenHandler({ org_id: 'org_123' });
      const sut = completeAuth;

      await sut('login');
      const authUrl = await sut('signup');

      expect(authUrl).not.toContain('organization=');
    });
  });

  describe('when Auth0 rejects a login with a remembered workspace', () => {
    it('retries without the organization parameter instead of failing', async () => {
      // Arrange
      using _auth = prepareAuthTokens('none');
      useTokenHandler({ org_id: 'org_123' });
      const sut = completeAuth;
      await sut('login');

      // Act
      const result = authenticate('login');
      const authUrl = await waitForOpenedUrl();
      const response = await hitCallback('?error=invalid_request', { redirect: 'manual' });
      const retryUrl = response.headers.get('location')!;
      await hitCallback('?code=test-code');
      await result;

      // Assert
      expect(authUrl).toContain('organization=org_123');
      expect(response.status).toBe(302);
      expect(retryUrl).toContain('/authorize?');
      expect(retryUrl).not.toContain('organization=');
    });
  });
});
