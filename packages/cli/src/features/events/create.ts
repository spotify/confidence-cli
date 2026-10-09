import type { JsonObject } from '@spotify-confidence/shared-kernel';
import { createEventDefinition } from '@network/index.js';
import { message, printMcpResult } from '@output/index.js';
import { withAuth } from '@utils/index.js';
import { resolveInput } from '@input/index.js';
import { parseFieldArg } from './field-spec.js';

export const createEvent = withAuth(async function createEvent(argv, token) {
  const eventDefinitionId = argv.name as string;

  const schema = resolveInput<JsonObject>(argv, () => {
    const fieldSpecs = (argv.field as string[] | undefined) ?? [];
    return Object.fromEntries(fieldSpecs.map(parseFieldArg));
  });

  if (Object.keys(schema).length === 0) {
    throw new Error('Provide at least one --field or --from-file.');
  }

  if (argv['dry-run']) {
    message(JSON.stringify({ eventDefinitionId, schema }, null, 2));
    return;
  }

  const result = await createEventDefinition(token, eventDefinitionId, schema);
  printMcpResult(result, argv);
});
