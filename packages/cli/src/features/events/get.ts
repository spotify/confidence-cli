import { getEventDefinition } from '@api/events.js';
import { print, fail, extractFlags } from '@output/print.js';
import { requireAuth } from './require-auth.js';
import { formatApiError } from './format-error.js';

export async function getEvent(argv: Record<string, unknown>): Promise<void> {
  const auth = requireAuth(argv.profile as string | undefined);
  if (!auth) return;

  const name = argv.name as string;
  const result = await getEventDefinition(auth.token, auth.region, name);

  if (!result.ok) {
    if (result.status === 404) {
      fail(`Event definition "${name}" not found.`);
      return;
    }
    fail(formatApiError(result));
    return;
  }

  const event = result.data;
  const fieldsDisplay = event.fields.map((f) => `${f.name} (${f.type})`).join(', ');

  print({
    data: {
      name: event.name,
      displayName: event.displayName,
      description: event.description ?? '',
      fields: fieldsDisplay,
      created: event.createTime ?? '',
      updated: event.updateTime ?? '',
    },
    columns: [
      { key: 'key', header: 'Field', width: 14 },
      { key: 'value', header: 'Value' },
    ],
    flags: extractFlags(argv),
  });
}
