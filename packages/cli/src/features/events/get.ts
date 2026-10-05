import { getEventDefinition } from '@network/events.js';
import { fail, printMcpResult } from '@output/print.js';
import { requireAuth } from '../../utils/require-auth.js';

export async function getEvent(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  const name = argv.name as string;

  try {
    const result = await getEventDefinition(token, name);
    printMcpResult(result, argv);
  } catch (err) {
    fail((err as Error).message);
  }
}
