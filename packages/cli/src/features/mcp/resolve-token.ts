import { message, fail } from '@output/print.js';
import { loadPersistedToken, authenticate, validateToken } from '@spotify-confidence/core';

export async function resolveAuthToken(opts?: {
  forceNew?: boolean;
  profile?: string;
}): Promise<string | null> {
  if (!opts?.forceNew) {
    const existing = loadPersistedToken(opts?.profile);
    if (existing) {
      const { valid } = validateToken(existing);
      if (valid) return existing;
    }
  }

  try {
    message('Authentication required. Opening browser...');
    const result = await authenticate({
      mode: 'login',
      profile: opts?.profile,
      onUrl: (url) => message(`If the browser did not open, visit:\n${url}`),
    });
    return result.accessToken;
  } catch (err) {
    fail(`Authentication failed: ${(err as Error).message}`);
    return null;
  }
}
