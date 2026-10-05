import { updateEventDefinition } from '@network/events.js';
import { message, fail, extractFlags } from '@output/print.js';
import { formatJson } from '@output/json.js';
import { resolveFormat } from '@output/detect.js';
import { requireAuth } from './require-auth.js';
import { parseFieldArg } from './create.js';

export async function updateEvent(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  const name = argv.name as string;
  const fieldSpecs = (argv.field as string[] | undefined) ?? [];

  if (fieldSpecs.length === 0) {
    fail('Provide at least one --field to add.');
    return;
  }

  let schema: Record<string, unknown>;
  try {
    schema = Object.fromEntries(fieldSpecs.map(parseFieldArg));
  } catch (err) {
    fail((err as Error).message);
    return;
  }

  try {
    const text = await updateEventDefinition(token, name, schema);
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
