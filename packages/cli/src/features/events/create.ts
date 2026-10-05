import { createEventDefinition } from '@network/index.js';
import { message, printMcpResult } from '@output/print.js';
import { withAuth } from '../../utils/require-auth.js';
import { resolveTargetFile } from '../../utils/read-json-file.js';
import { parseFieldArg } from './field-spec.js';

export const createEvent = withAuth(async function createEvent(argv, token) {
  const eventDefinitionId = argv.name as string;

  const schema = resolveTargetFile<Record<string, unknown>>(argv, () => {
    const fieldSpecs = (argv.field as string[] | undefined) ?? [];
    if (fieldSpecs.length === 0) {
      throw new Error('Provide at least one --field or --from-file.');
    }
    return Object.fromEntries(fieldSpecs.map(parseFieldArg));
  });

  if (argv['dry-run']) {
    message(JSON.stringify({ eventDefinitionId, schema }, null, 2));
    return;
  }

  const result = await createEventDefinition(token, eventDefinitionId, schema);
  printMcpResult(result, argv);
});
