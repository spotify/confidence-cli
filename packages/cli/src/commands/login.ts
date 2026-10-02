import { authenticate } from '@spotify-confidence/core';
import { message, fail } from '@output/print.js';

export const loginCommand = {
  command: 'login',
  describe: 'Sign in to Confidence via browser OAuth',
  async handler(argv: Record<string, unknown>) {
    const profile = argv.profile as string | undefined;

    try {
      message('Opening browser for authentication...');
      const result = await authenticate('login', undefined, profile, (url) => {
        message(`If the browser did not open, visit:\n${url}`);
      });
      message(`Authenticated as ${result.workspace ?? 'unknown'} (${result.region})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      fail(`Login failed: ${msg}`);
    }
  },
};
