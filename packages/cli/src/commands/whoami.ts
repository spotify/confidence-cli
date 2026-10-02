import { loadPersistedToken, validateToken, decodeJwtPayload } from '@spotify-confidence/core';
import { print, fail, extractFlags } from '@output/print.js';

export const whoamiCommand = {
  command: 'whoami',
  describe: 'Show current user, org, region, and token expiry',
  handler(argv: Record<string, unknown>) {
    const profile = argv.profile as string | undefined;

    const token = loadPersistedToken(profile);
    if (!token) {
      fail('Not logged in. Run "confidence login" first.');
      return;
    }

    const validation = validateToken(token);
    if (!validation.valid) {
      fail('Token is expired. Run "confidence login" to re-authenticate.');
      return;
    }

    const payload = decodeJwtPayload(token);
    const email = (payload.email as string) ?? undefined;
    const org =
      (payload.org_id as string) ??
      (payload['https://confidence.dev/org_login_id'] as string) ??
      undefined;
    const exp = payload.exp as number | undefined;
    const expiresAt = exp ? new Date(exp * 1000).toISOString() : 'unknown';

    print({
      data: {
        email: email ?? 'unknown',
        organization: org ?? 'unknown',
        region: validation.region ?? 'unknown',
        workspace: validation.workspace ?? 'unknown',
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
