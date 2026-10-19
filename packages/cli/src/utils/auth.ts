import {
  loadPersistedToken,
  isValidToken as isValid,
  decodeJwtPayload,
  refreshAccessToken,
  hasExpiredSession,
  hasMalformedToken,
  authenticate,
  isInteractive,
} from '@spotify-confidence/core';
import { fail, hint } from '@output/print.js';

type LoadTokenResult = {
  token: string | null;
  expired: boolean;
};

export async function tryLoadAuthToken(profile?: string): Promise<LoadTokenResult> {
  const token = loadPersistedToken(profile);
  if (!token) return { token: null, expired: false };
  if (isValid(token)) return { token, expired: false };

  try {
    decodeJwtPayload(token);
    const refreshed = await refreshAccessToken(profile);
    return { token: refreshed.accessToken, expired: false };
  } catch (err) {
    if (hasMalformedToken(err)) return { token: null, expired: false };
    if (hasExpiredSession(err)) return { token: null, expired: true };
    throw err;
  }
}

export async function tryResolveAuth(profile?: string): Promise<string | null> {
  try {
    const loaded = await tryLoadAuthToken(profile);
    if (loaded.token) return loaded.token;

    if (!isInteractive()) {
      fail(
        loaded.expired
          ? 'Token expired. Run "confidence login" to re-authenticate.'
          : 'Not logged in. Run "confidence login" first.',
      );
      return null;
    }

    hint(
      loaded.expired
        ? 'Session expired. Opening browser to re-authenticate... (Ctrl+C to cancel)'
        : 'Not logged in to Confidence. Opening browser to authenticate... (Ctrl+C to cancel)',
    );

    const result = await authenticate({
      mode: 'login',
      profile,
      onUrl: (url) => hint(`If the browser did not open, visit:\n${url}`),
    });

    hint(`Authenticated as ${result.workspace ?? 'unknown'} (${result.region})`);
    return result.accessToken;
  } catch (err) {
    fail(`Login failed: ${(err as Error).message}`);
    return null;
  }
}

export function withAuth(
  fn: (argv: Record<string, unknown>, token: string) => Promise<void>,
): (argv: Record<string, unknown>) => Promise<void> {
  return async (argv) => {
    const token = await tryResolveAuth(argv.profile as string | undefined);
    if (!token) return;

    await fn(argv, token);
  };
}
