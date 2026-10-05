import { listEventDefinitions } from '@api/events.js';
import { print, fail, extractFlags } from '@output/print.js';
import { requireAuth } from './require-auth.js';
import { formatApiError } from './format-error.js';

export async function listEvents(argv: Record<string, unknown>): Promise<void> {
  const auth = requireAuth(argv.profile as string | undefined);
  if (!auth) return;

  const result = await listEventDefinitions(auth.token, auth.region, {
    pageSize: argv['page-size'] as number | undefined,
    pageToken: argv['page-token'] as string | undefined,
  });

  if (!result.ok) {
    fail(formatApiError(result));
    return;
  }

  print({
    data: result.data.items.map((e) => ({
      name: e.name,
      displayName: e.displayName,
      fields: String(e.fields.length),
      created: e.createTime ?? '',
    })),
    columns: [
      { key: 'name', header: 'Name', width: 30 },
      { key: 'displayName', header: 'Display Name', width: 25 },
      { key: 'fields', header: 'Fields' },
      { key: 'created', header: 'Created' },
    ],
    flags: extractFlags(argv),
    empty: 'No event definitions found.',
  });
}
