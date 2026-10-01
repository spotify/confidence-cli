import { authenticate } from '@spotify-confidence/core';

export const loginCommand = {
  command: 'login',
  describe: 'Sign in to Confidence via browser OAuth',
  async handler(argv: Record<string, unknown>) {
    const profile = argv.profile as string | undefined;

    try {
      console.log('Opening browser for authentication...');
      const result = await authenticate('login', undefined, profile, (url) => {
        console.log(`If the browser did not open, visit:\n${url}`);
      });
      console.log(`Authenticated as ${result.workspace ?? 'unknown'} (${result.region})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      console.error(`Login failed: ${msg}`);
      process.exitCode = 1;
    }
  },
};
