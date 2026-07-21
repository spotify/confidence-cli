import type { AuthState } from '@lib/session.js';

function base64url(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64url');
}

export function buildTestJwt(claims: Record<string, unknown> = {}): string {
  const header = base64url(JSON.stringify({ alg: 'RS256' }));
  const payload = base64url(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 86400,
      'https://confidence.dev/region': 'EU',
      email: 'test@example.com',
      ...claims,
    }),
  );
  return `${header}.${payload}.fake-signature`;
}

export function buildExpiredJwt(): string {
  return buildTestJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
}

export function buildAuthState(token?: string): AuthState {
  return {
    status: 'authenticated',
    token: token ?? buildTestJwt(),
    region: 'EU',
  };
}
