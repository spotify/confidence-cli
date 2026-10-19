import { hint, fail } from '@output/print.js';
import { authenticate } from '@spotify-confidence/core';
import { tryLoadAuthToken } from '@utils/auth.js';

export async function resolveAuthToken(opts?: {
  forceNew?: boolean;
  profile?: string;
}): Promise<string | null> {
  try {
    if (!opts?.forceNew) {
      const { token } = await tryLoadAuthToken(opts?.profile);
      if (token) return token;
    }

    hint('Authentication required. Opening browser... (Ctrl+C to cancel)');
    const result = await authenticate({
      mode: 'login',
      profile: opts?.profile,
      onUrl: (url) => hint(`If the browser did not open, visit:\n${url}`),
    });
    return result.accessToken;
  } catch (err) {
    fail(`Authentication failed: ${(err as Error).message}`);
    return null;
  }
}
