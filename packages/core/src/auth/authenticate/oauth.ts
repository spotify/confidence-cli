import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { env } from '../../system/env.js';
import { readCredentials, writeCredentials } from '../credentials/index.js';
import { extractRegion, extractOrganization, validateToken } from '../jwt.js';
import { successPage, errorPage, exchangeErrorPage } from '../callback-pages.js';
import {
  AUTH_BASE_URL,
  AUTH_CLIENT_ID_SIGNUP,
  AUTH_CLIENT_ID_LOGIN,
  AUTH_CALLBACK_PORT,
} from './constants.js';
import { generatePKCE } from './pkce.js';
import { openBrowser } from './browser.js';
import { exchangeCode, buildAuthUrl, type TokenResponse } from './exchange.js';

export type AuthResult = {
  accessToken: string;
  refreshToken?: string;
  region: 'EU' | 'US';
  workspace?: string;
};

function persistTokens(accessToken: string, refreshToken?: string, profile?: string): void {
  const organization = extractOrganization(accessToken);
  writeCredentials({ accessToken, refreshToken, organization }, profile);
}

function resolveOrganization(profile?: string): string | undefined {
  const override = env('CONFIDENCE_ORGANIZATION');
  if (override) return override;
  const creds = readCredentials(profile);
  return creds?.organization ?? undefined;
}

export async function refreshAccessToken(profile?: string): Promise<AuthResult> {
  const creds = readCredentials(profile);
  if (!creds?.refreshToken) {
    throw new Error('No refresh token available');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: AUTH_CLIENT_ID_LOGIN,
    refresh_token: creds.refreshToken,
  });

  const response = await fetch(`${AUTH_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error('Session expired');
  }

  const data = (await response.json()) as TokenResponse;
  persistTokens(data.access_token, data.refresh_token, profile);

  const region = extractRegion(data.access_token);
  const { workspace } = validateToken(data.access_token);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    region,
    workspace,
  };
}

export function authenticate(
  mode: 'signup' | 'login',
  signal?: AbortSignal,
  profile?: string,
): Promise<AuthResult> {
  const clientId = mode === 'signup' ? AUTH_CLIENT_ID_SIGNUP : AUTH_CLIENT_ID_LOGIN;
  const organization = mode === 'login' ? resolveOrganization(profile) : undefined;
  const { verifier, challenge } = generatePKCE();
  const redirectUri = `http://localhost:${AUTH_CALLBACK_PORT}/callback`;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Authentication cancelled'));
      return;
    }

    let retriedWithoutOrganization = false;

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
        if (organization && !retriedWithoutOrganization) {
          retriedWithoutOrganization = true;
          res.writeHead(302, { Location: buildAuthUrl({ clientId, challenge, redirectUri }) });
          res.end();
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorPage);
        server.close();
        reject(new Error(error ?? 'No authorization code received'));
        return;
      }

      try {
        const tokenResponse = await exchangeCode({ code, clientId, verifier, redirectUri });
        const { access_token, refresh_token } = tokenResponse;

        persistTokens(access_token, refresh_token, profile);

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
      const authUrl = buildAuthUrl({ clientId, challenge, redirectUri, organization });
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
