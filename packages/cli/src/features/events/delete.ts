import confirm from '@inquirer/confirm';
import { extractText } from '@spotify-confidence/core';
import { deleteEventDefinition } from '@network/events.js';
import { message, fail } from '@output/print.js';
import { requireAuth } from './require-auth.js';

export async function deleteEvent(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  const name = argv.name as string;

  const confirmed = await confirm({
    message: `Delete event definition "${name}"? This cannot be undone.`,
    default: false,
  });

  if (!confirmed) {
    message('Aborted.');
    return;
  }

  try {
    extractText(await deleteEventDefinition(token, name));
    message(`Event definition "${name}" deleted.`);
  } catch (err) {
    fail((err as Error).message);
  }
}
