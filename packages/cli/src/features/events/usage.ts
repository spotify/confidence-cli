import { queryEventsUsage } from '@network/events.js';
import { message, fail, extractFlags } from '@output/print.js';
import { formatJson } from '@output/json.js';
import { resolveFormat } from '@output/detect.js';
import { requireAuth } from './require-auth.js';

export async function eventUsage(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  const name = argv.name as string;
  const daysBack = argv.days as number | undefined;

  try {
    const text = await queryEventsUsage(token, name, { daysBack });
    const format = resolveFormat(extractFlags(argv));
    if (format === 'json') {
      message(formatJson(text));
    } else {
      message(text);
    }
  } catch (err) {
    fail((err as Error).message);
  }
}
