import { readFileSync } from 'node:fs';
import { publishEvent } from '@api/events.js';
import { message, fail } from '@output/print.js';
import { requireAuth } from './require-auth.js';
import { formatApiError } from './format-error.js';

function readPayload(argv: Record<string, unknown>): Record<string, unknown> {
  const data = argv.data as string | undefined;
  const fromFile = argv['from-file'] as string | undefined;

  if (data) {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch (err) {
      throw new Error('Invalid JSON in --data.', { cause: err });
    }
  }

  if (fromFile) {
    let content: string;
    try {
      content = readFileSync(fromFile, 'utf-8');
    } catch (err) {
      throw new Error(`Could not read file "${fromFile}": ${(err as Error).message}`, {
        cause: err,
      });
    }
    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch (err) {
      throw new Error(`Invalid JSON in "${fromFile}".`, { cause: err });
    }
  }

  throw new Error('Provide event data via --data or --from-file.');
}

export async function trackEvent(argv: Record<string, unknown>): Promise<void> {
  const auth = requireAuth(argv.profile as string | undefined);
  if (!auth) return;

  const eventDefinition = argv.event as string;

  let payload: Record<string, unknown>;
  try {
    payload = readPayload(argv);
  } catch (err) {
    fail((err as Error).message);
    return;
  }

  const body = { eventDefinition, payload };

  if (argv['dry-run']) {
    message(JSON.stringify(body, null, 2));
    return;
  }

  const result = await publishEvent(auth.token, auth.region, body);

  if (!result.ok) {
    fail(formatApiError(result));
    return;
  }

  message('Event published successfully.');
}
