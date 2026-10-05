import { listFlags } from '@network/index.js';
import { resolveFormat, formatJson, extractFlags, fail, message, print } from '@output/index.js';
import { withAuth } from '@utils/require-auth.js';
import { flagStatus } from './status.js';

export const listFlagsCmd = withAuth(async function listFlagsCmd(argv, token) {
  const result = await listFlags(token, {
    pageToken: argv['page-token'] as string | undefined,
  });

  if (!result.ok) {
    fail(result.error.message);
    return;
  }

  const flags = extractFlags(argv);
  const format = resolveFormat(flags);

  if (format === 'json') {
    const meta = result.data.nextPageToken
      ? { nextPageToken: result.data.nextPageToken }
      : undefined;
    message(formatJson(result.data.flags ?? [], meta));
    return;
  }

  const rows = (result.data.flags ?? []).map((f) => ({
    key: f.flagId ?? f.name.replace(/^flags\//, ''),
    status: flagStatus(f),
    variants: String(f.variants?.length ?? 0),
    updated: f.updateTime ?? '',
  }));

  print({
    data: rows,
    columns: [
      { key: 'key', header: 'Flag Key' },
      { key: 'status', header: 'Status' },
      { key: 'variants', header: 'Variants' },
      { key: 'updated', header: 'Updated' },
    ],
    flags,
    empty: 'No flags found.',
  });

  if (result.data.nextPageToken) {
    message(`\nNext page: --page-token ${result.data.nextPageToken}`);
  }
});
