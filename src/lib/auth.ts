import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from './env.js';
import { successPage, errorPage, exchangeErrorPage } from './callback-pages.js';

const AUTH_DOMAIN = env('CONFIDENCE_AUTH_DOMAIN', 'auth.confidence.dev');
const AUTH_BASE_URL = env('CONFIDENCE_AUTH_URL', `https://${AUTH_DOMAIN}`);
const AUTH_AUDIENCE = 'https://confidence.dev/';
const AUTH_SCOPE = 'openid profile email offline_access';
const AUTH_CLIENT_ID_SIGNUP = '82qMvwZvqd3t3S0gRDvs8R53TehQXSJY';
const AUTH_CLIENT_ID_LOGIN = '2fG3H4RhlAbIZm9Rfn32zTaILH7w1X4w';
export const AUTH_CALLBACK_PORT = 8084;

const TOKEN_FILE = join(tmpdir(), 'confidence_token');
const REFRESH_TOKEN_FILE = join(tmpdir(), 'confidence_refresh_token');

function base64url(buf: Buffer): string {
  return buf.toString('base64url');
}

function generatePKCE() {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';

  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];

  execFile(cmd, args);
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length < 2) throw new Error('Invalid JWT');
  const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
  return JSON.parse(payload) as Record<string, unknown>;
}

function extractRegion(token: string): 'EU' | 'US' {
  const payload = decodeJwtPayload(token);
  const region = payload['https://confidence.dev/region'];
  return region === 'US' ? 'US' : 'EU';
}

function persistTokens(accessToken: string, refreshToken?: string): void {
  const config = { encoding: 'utf-8', mode: 0o600 } as const;
  writeFileSync(TOKEN_FILE, accessToken, config);
  if (refreshToken) {
    writeFileSync(REFRESH_TOKEN_FILE, refreshToken, config);
  }
}

export function loadPersistedToken(): string | null {
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    return readFileSync(TOKEN_FILE, 'utf-8').trim();
  } catch {
    return null;
  }
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

type AuthResult = {
  accessToken: string;
  refreshToken?: string;
  region: 'EU' | 'US';
  workspace?: string;
};

export function authenticate(mode: 'signup' | 'login', signal?: AbortSignal): Promise<AuthResult> {
  const clientId = mode === 'signup' ? AUTH_CLIENT_ID_SIGNUP : AUTH_CLIENT_ID_LOGIN;
  const { verifier, challenge } = generatePKCE();
  const redirectUri = `http://localhost:${AUTH_CALLBACK_PORT}/callback`;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Authentication cancelled'));
      return;
    }

    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? '/', `http://localhost:${AUTH_CALLBACK_PORT}`);

      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end();
        return;
      }

      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error || !code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorPage);
        server.close();
        reject(new Error(error ?? 'No authorization code received'));
        return;
      }

      try {
        const tokenResponse = await exchangeCode({ code, clientId, verifier, redirectUri });
        const { access_token, refresh_token } = tokenResponse;

        persistTokens(access_token, refresh_token);

        const region = extractRegion(access_token);
        const { workspace } = validateToken(access_token);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(successPage);
        server.close();
        resolve({ accessToken: access_token, refreshToken: refresh_token, region, workspace });
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(exchangeErrorPage);
        server.close();
        reject(err);
      }
    });

    server.listen(AUTH_CALLBACK_PORT, () => {
      const authUrl = buildAuthUrl(clientId, challenge, redirectUri);
      openBrowser(authUrl);
    });

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          server.close();
          reject(new Error('Authentication cancelled'));
        },
        { once: true },
      );
    }

    server.on('error', (err) => {
      reject(
        new Error(`Failed to start auth server on port ${AUTH_CALLBACK_PORT}: ${err.message}`),
      );
    });
  });
}

function buildAuthUrl(clientId: string, challenge: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: AUTH_SCOPE,
    audience: AUTH_AUDIENCE,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return `${AUTH_BASE_URL}/authorize?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
};

async function exchangeCode(opts: {
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
