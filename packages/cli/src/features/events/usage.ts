import { isDefined } from '@spotify-confidence/shared-kernel';
import { queryEventsUsage } from '@network/events.js';
import { fail, printMcpResult } from '@output/print.js';
import { requireAuth } from '../../utils/require-auth.js';

export async function eventUsage(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  const name = argv.name as string;
  const daysBack = argv.days as number | undefined;

  if (isDefined(daysBack) && (daysBack < 1 || daysBack > 7)) {
    fail('--days must be between 1 and 7.');
    return;
  }

  try {
    const result = await queryEventsUsage(token, name, { daysBack });
    printMcpResult(result, argv);
  } catch (err) {
    fail((err as Error).message);
  }
}
