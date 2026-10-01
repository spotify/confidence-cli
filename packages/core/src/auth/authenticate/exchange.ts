import { AUTH_BASE_URL, AUTH_SCOPE, AUTH_AUDIENCE } from './constants.js';

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
};

export async function exchangeCode(opts: {
  code: string;
  clientId: string;
  verifier: string;
  redirectUri: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: opts.clientId,
    code_verifier: opts.verifier,
    code: opts.code,
    redirect_uri: opts.redirectUri,
  });

  const response = await fetch(`${AUTH_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${text}`);
  }

  return (await response.json()) as TokenResponse;
}

export function buildAuthUrl(opts: {
  clientId: string;
  challenge: string;
  redirectUri: string;
  organization?: string;
}): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    scope: AUTH_SCOPE,
    audience: AUTH_AUDIENCE,
    code_challenge: opts.challenge,
    code_challenge_method: 'S256',
  });
  if (opts.organization) {
    params.set('organization', opts.organization);
  }
  return `${AUTH_BASE_URL}/authorize?${params.toString()}`;
}
