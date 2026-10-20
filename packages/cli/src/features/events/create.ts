import type { JsonObject } from '@spotify-confidence/shared-kernel';
import { createEventDefinition } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withCrossCutting } from '@composition';
import { dryRunGuard } from '@utils/index.js';
import { resolveInput } from '@input/index.js';
import { parseFieldArg } from './field-spec.js';

export const createEvent = withCrossCutting(async function createEvent(argv, token) {
  const eventDefinitionId = argv.name as string;

  const schema = resolveInput<JsonObject>(argv, () => {
    const fieldSpecs = (argv.field as string[] | undefined) ?? [];
    return Object.fromEntries(fieldSpecs.map(parseFieldArg));
  });

  if (Object.keys(schema).length === 0) {
    throw new Error('Provide at least one --field or --from-file.');
  }

  if (dryRunGuard(argv, { eventDefinitionId, schema })) return;

  const result = await createEventDefinition(token, eventDefinitionId, schema);
  printMcpResult(result, argv);
});
