import confirm from '@inquirer/confirm';
import { archiveFlag } from '@network/index.js';
import { message, fail } from '@output/index.js';
import { withAuth } from '@utils/index.js';

export const archiveFlagCmd = withAuth(async function archiveFlagCmd(argv, token) {
  const flagKey = argv['flag-key'] as string;

  if (argv['dry-run']) {
    message(JSON.stringify({ action: 'archive', flagKey }, null, 2));
    return;
  }

  if (!argv.force) {
    if (!process.stdin.isTTY) {
      fail('Cannot prompt for confirmation without a TTY. Use --force to skip.');
      return;
    }

    const confirmed = await confirm({
      message: `Archive flag "${flagKey}"? This cannot be undone.`,
      default: false,
    });

    if (!confirmed) {
      message('Aborted.');
      return;
    }
  }

  const result = await archiveFlag(token, flagKey);

  if (!result.ok) {
    fail(result.error.message);
    return;
  }

  message(`Flag "${flagKey}" archived.`);
});
