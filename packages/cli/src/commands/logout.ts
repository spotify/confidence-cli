import { clearTokens } from '@spotify-confidence/core';
import { message } from '@output/print.js';

export const logoutCommand = {
  command: 'logout',
  describe: 'Clear stored credentials',
  handler(argv: Record<string, unknown>) {
    const profile = argv.profile as string | undefined;
    clearTokens(profile);
    message('Logged out.');
  },
};
