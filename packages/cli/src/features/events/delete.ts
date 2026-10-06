import confirm from '@inquirer/confirm';
import { extractText } from '@spotify-confidence/core';
import { deleteEventDefinition } from '@network/index.js';
import { message, fail } from '@output/print.js';
import { withAuth } from '@utils/index.js';

export const deleteEvent = withAuth(async function deleteEvent(argv, token) {
  const name = argv.name as string;

  if (argv['dry-run']) {
    message(JSON.stringify({ action: 'delete', name }, null, 2));
    return;
  }

  if (!argv.force) {
    if (!process.stdin.isTTY) {
      fail('Cannot prompt for confirmation without a TTY. Use --force to skip.');
      return;
    }

    const confirmed = await confirm({
      message: `Delete event definition "${name}"? This cannot be undone.`,
      default: false,
    });

    if (!confirmed) {
      message('Aborted.');
      return;
    }
  }

  extractText(await deleteEventDefinition(token, name));
  message(`Event definition "${name}" deleted.`);
});
