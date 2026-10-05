import { readFileSync } from 'node:fs';
import { publishEvent } from '@network/events.js';
import { message, fail } from '@output/print.js';
import { requireAuth } from './require-auth.js';

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
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

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

  try {
    await publishEvent(token, body);
    message('Event published successfully.');
  } catch (err) {
    fail((err as Error).message);
  }
}
