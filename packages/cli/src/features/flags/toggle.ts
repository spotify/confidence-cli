import { toggleFlag } from '@network/index.js';
import { fail, message } from '@output/index.js';
import { withAuth } from '@utils/require-auth.js';

export const toggleFlagCmd = withAuth(async function toggleFlagCmd(argv, token) {
  const flagKey = argv['flag-key'] as string;
  const enabled = argv.on === true;

  if (argv['dry-run']) {
    message(JSON.stringify({ flagKey, enabled }, null, 2));
    return;
  }

  const result = await toggleFlag(token, flagKey, enabled);

  if (!result.ok) {
    fail(result.error.message);
    return;
  }

  message(`Flag "${flagKey}" ${enabled ? 'enabled' : 'disabled'}.`);
});
