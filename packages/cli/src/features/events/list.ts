import { listEventDefinitions } from '@network/events.js';
import { message, fail, extractFlags } from '@output/print.js';
import { formatJson } from '@output/json.js';
import { resolveFormat } from '@output/detect.js';
import { requireAuth } from './require-auth.js';

export async function listEvents(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  try {
    const text = await listEventDefinitions(token, {
      pageToken: argv['page-token'] as string | undefined,
    });

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
