import { toggleFlag } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withCrossCutting } from '@composition';
import { dryRunGuard } from '@utils/index.js';

export const toggleFlagCmd = withCrossCutting(async function toggleFlagCmd(argv, token) {
  const flagKey = argv['flag-key'] as string;
  const enabled = argv.on === true;
  const client = argv.client as string;

  if (dryRunGuard(argv, { flagKey, enabled, client })) return;

  const result = await toggleFlag(token, flagKey, { enabled, client });
  printMcpResult(result, argv);
});
