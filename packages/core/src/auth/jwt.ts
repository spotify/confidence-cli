export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length < 2) throw new Error('Invalid JWT');
  const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
  return JSON.parse(payload) as Record<string, unknown>;
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

export function validateToken(token: string): {
  valid: boolean;
  region?: 'EU' | 'US';
  workspace?: string;
} {
  try {
    const payload = decodeJwtPayload(token);
    const exp = payload.exp as number | undefined;
    if (exp && Date.now() / 1000 > exp) {
      return { valid: false };
    }
    const region = extractRegion(token);
    const workspace =
      (payload['https://confidence.dev/account_name'] as string) ??
      (payload.email as string) ??
      undefined;
    return { valid: true, region, workspace };
  } catch {
    return { valid: false };
  }
}
