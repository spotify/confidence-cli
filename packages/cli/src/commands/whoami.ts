import { loadPersistedToken, validateToken, decodeJwtPayload } from '@spotify-confidence/core';
import { resolveFormat } from '@output/detect.js';
import { formatJson } from '@output/json.js';
import { formatTable } from '@output/table.js';

export const whoamiCommand = {
  command: 'whoami',
  describe: 'Show current user, org, region, and token expiry',
  handler(argv: Record<string, unknown>) {
    const profile = argv.profile as string | undefined;
    const json = argv.json as boolean | undefined;
    const output = argv.output as 'json' | 'table' | 'plain' | undefined;

    const token = loadPersistedToken(profile);
    if (!token) {
      console.error('Not logged in. Run "confidence login" first.');
      process.exitCode = 1;
      return;
    }

    const validation = validateToken(token);
    if (!validation.valid) {
      console.error('Token is expired. Run "confidence login" to re-authenticate.');
      process.exitCode = 1;
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

    const info = {
      email: email ?? 'unknown',
      organization: org ?? 'unknown',
      region: validation.region ?? 'unknown',
      workspace: validation.workspace ?? 'unknown',
      expires: expiresAt,
      profile: profile ?? 'default',
    };

    const format = resolveFormat({ json, output });

    if (format === 'json') {
      console.log(formatJson(info));
    } else {
      const rows = Object.entries(info).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      console.log(
        formatTable(rows, [
          { key: 'key', header: 'Field', width: 14 },
          { key: 'value', header: 'Value' },
        ]),
      );
    }
  },
};
