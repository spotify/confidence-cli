import { isDefined } from '@spotify-confidence/shared-kernel';
import { queryEventsUsage } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '../../utils/require-auth.js';

export const eventUsage = withAuth(async function eventUsage(argv, token) {
  const name = argv.name as string;
  const daysBack = argv.days as number | undefined;

  if (isDefined(daysBack) && (daysBack < 1 || daysBack > 7)) {
    throw new Error('--days must be between 1 and 7.');
  }

  const result = await queryEventsUsage(token, name, { daysBack });
  printMcpResult(result, argv);
});
