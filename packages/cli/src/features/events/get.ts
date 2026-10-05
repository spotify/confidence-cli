import { getEventDefinition } from '@network/events.js';
import { print, fail, extractFlags } from '@output/print.js';
import { requireAuth } from './require-auth.js';

export async function getEvent(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  const name = argv.name as string;

  try {
    const event = await getEventDefinition(token, name);
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
  } catch (err) {
    fail((err as Error).message);
  }
}
