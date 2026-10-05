import { updateEventDefinition } from '@network/events.js';
import { fail, printMcpResult } from '@output/print.js';
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
    const result = await updateEventDefinition(token, name, schema);
    printMcpResult(result, argv);
  } catch (err) {
    fail((err as Error).message);
  }
}
