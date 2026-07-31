import type { AuthState } from '@lib/session.js';

function base64url(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64url');
}

/**
 * Builds an unsigned JWT with sensible test defaults.
 *
 * The token is structurally valid (base64url header + payload + empty
 * signature) but uses `alg: 'none'` — sufficient for the wizard's
 * client-side expiry check without needing a signing key.
 *
 * @param claims - Custom claims merged into the payload. Use `exp` to
 *   control token expiry (epoch seconds).
 * @returns A JWT string like `eyJ...eyJ...`.
 *
 * @example
 * ```ts
 * buildTestJwt()                                        // valid for 24h
 * buildTestJwt({ exp: Math.floor(Date.now() / 1000) - 60 }) // expired 1 min ago
 * ```
 */
export function buildTestJwt(claims: Record<string, unknown> = {}): string {
  const header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 86400,
      'https://confidence.dev/region': 'EU',
      email: 'test@example.com',
      ...claims,
    }),
  );
  return `${header}.${payload}.`;
}

/**
 * Builds a JWT that expired one hour ago.
 *
 * @returns An expired JWT string.
 */
export function buildExpiredJwt(): string {
  return buildTestJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
}

/**
 * Builds a complete {@link AuthState} object with a valid (or custom) token.
 *
 * @param token - Optional JWT string. Defaults to a fresh test JWT.
 * @returns An `AuthState` with `status: 'authenticated'` and `region: 'EU'`.
 */
export function buildAuthState(token?: string): AuthState {
  return {
    status: 'authenticated',
    token: token ?? buildTestJwt(),
    region: 'EU',
  };
}
