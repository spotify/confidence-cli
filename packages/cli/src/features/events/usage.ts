import { queryEventsUsage } from '@network/events.js';
import { fail, printMcpResult } from '@output/print.js';
import { requireAuth } from './require-auth.js';

export async function eventUsage(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  const name = argv.name as string;
  const daysBack = argv.days as number | undefined;

  try {
    const result = await queryEventsUsage(token, name, { daysBack });
    printMcpResult(result, argv);
  } catch (err) {
    fail((err as Error).message);
  }
}
