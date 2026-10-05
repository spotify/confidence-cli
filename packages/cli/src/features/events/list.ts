import { listEventDefinitions } from '@network/events.js';
import { fail, printMcpResult } from '@output/print.js';
import { requireAuth } from './require-auth.js';

export async function listEvents(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  try {
    const result = await listEventDefinitions(token, {
      pageToken: argv['page-token'] as string | undefined,
    });
    printMcpResult(result, argv);
  } catch (err) {
    fail((err as Error).message);
  }
}
