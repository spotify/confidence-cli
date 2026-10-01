import { clearTokens } from '@spotify-confidence/core';

export const logoutCommand = {
  command: 'logout',
  describe: 'Clear stored credentials',
  handler(argv: Record<string, unknown>) {
    const profile = argv.profile as string | undefined;
    clearTokens(profile);
    console.log('Logged out.');
  },
};
