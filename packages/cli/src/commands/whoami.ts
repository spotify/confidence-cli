import {
  decodeJwtPayload,
  extractRegion,
  extractOrganization,
  extractWorkspace,
} from '@spotify-confidence/core';
import { print, extractFlags, fail } from '@output/print.js';
import { tryLoadAuthToken } from '@utils/auth.js';

export const whoamiCommand = {
  command: 'whoami',
  describe: 'Show current user, org, region, and token expiry',
  async handler(argv: Record<string, unknown>) {
    const profile = argv.profile as string | undefined;

    const { token, expired } = await tryLoadAuthToken(profile);
    if (!token) {
      fail(
        expired
          ? 'Auth expired. Run "confidence login" to re-authenticate.'
          : 'Not logged in. Run "confidence login" first.',
      );
      return;
    }

    const payload = decodeJwtPayload(token);
    const email = (payload.email as string) ?? undefined;
    const exp = payload.exp as number | undefined;
    const expiresAt = exp ? new Date(exp * 1000).toISOString() : 'unknown';

    print({
      data: {
        email: email ?? 'unknown',
        organization: extractOrganization(token) ?? 'unknown',
        region: extractRegion(token),
        workspace: extractWorkspace(token) ?? 'unknown',
        expires: expiresAt,
        profile: profile ?? 'default',
      },
      columns: [
        { key: 'key', header: 'Field', width: 14 },
        { key: 'value', header: 'Value' },
      ],
      flags: extractFlags(argv),
    });
  },
};
