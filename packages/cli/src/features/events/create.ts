import { readFileSync } from 'node:fs';
import { createEventDefinition } from '@network/events.js';
import { message, fail, printMcpResult } from '@output/print.js';
import { requireAuth } from './require-auth.js';
import { parseFieldArg } from './field-spec.js';

function readSchemaFromFile(filePath: string): Record<string, unknown> {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Could not read file "${filePath}": ${(err as Error).message}`, { cause: err });
  }

  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch (err) {
    throw new Error(`Invalid JSON in "${filePath}".`, { cause: err });
  }
}

export async function createEvent(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  const eventDefinitionId = argv.name as string;
  let schema: Record<string, unknown>;

  try {
    const fromFile = argv['from-file'] as string | undefined;
    if (fromFile) {
      schema = readSchemaFromFile(fromFile);
    } else {
      const fieldSpecs = (argv.field as string[] | undefined) ?? [];
      if (fieldSpecs.length === 0) {
        fail('Provide at least one --field or --from-file.');
        return;
      }

      schema = Object.fromEntries(fieldSpecs.map(parseFieldArg));
    }
  } catch (err) {
    fail((err as Error).message);
    return;
  }

  if (argv['dry-run']) {
    message(JSON.stringify({ eventDefinitionId, schema }, null, 2));
    return;
  }

  try {
    const result = await createEventDefinition(token, eventDefinitionId, schema);
    printMcpResult(result, argv);
  } catch (err) {
    fail((err as Error).message);
  }
}
