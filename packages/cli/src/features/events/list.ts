import { listEventDefinitions } from '@network/events.js';
import { print, fail, extractFlags } from '@output/print.js';
import { requireAuth } from './require-auth.js';

export async function listEvents(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  try {
    const items = await listEventDefinitions(token, {
      pageSize: argv['page-size'] as number | undefined,
      pageToken: argv['page-token'] as string | undefined,
    });

    print({
      data: items.map((e) => ({
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
  } catch (err) {
    fail((err as Error).message);
  }
}
