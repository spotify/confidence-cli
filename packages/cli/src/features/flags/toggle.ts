import { toggleFlag } from '@network/index.js';
import { message, printMcpResult } from '@output/index.js';
import { withAuth } from '@utils/index.js';

export const toggleFlagCmd = withAuth(async function toggleFlagCmd(argv, token) {
  const flagKey = argv['flag-key'] as string;
  const enabled = argv.on === true;
  const client = argv.client as string;

  if (argv['dry-run']) {
    message(JSON.stringify({ flagKey, enabled, client }, null, 2));
    return;
  }

  const result = await toggleFlag(token, flagKey, { enabled, client });
  printMcpResult(result, argv);
});
