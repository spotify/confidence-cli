import { MALFORMED_TOKEN_ERR } from './authenticate/constants.js';

export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.split('.');
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid JWT', { cause: MALFORMED_TOKEN_ERR });
  }
}

export function extractRegion(token: string): 'EU' | 'US' {
  const payload = decodeJwtPayload(token);
  const region = payload['https://confidence.dev/region'];
  return region === 'US' ? 'US' : 'EU';
}

export function extractOrganization(token: string): string | undefined {
  const payload = decodeJwtPayload(token);
  const organization =
    (payload.org_id as string | undefined) ??
    (payload['https://confidence.dev/org_login_id'] as string | undefined);
  return organization ?? undefined;
}

export function extractWorkspace(token: string): string | undefined {
  const payload = decodeJwtPayload(token);
  return (
    (payload['https://confidence.dev/account_name'] as string) ??
    (payload.email as string) ??
    undefined
  );
}

export function isValidToken(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token);
    const exp = payload.exp as number | undefined;
    return !exp || Date.now() / 1000 <= exp;
  } catch {
    return false;
  }
}
