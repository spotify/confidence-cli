import { updateEventDefinition } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '@utils/index.js';
import { parseFieldArg } from './field-spec.js';

export const updateEvent = withAuth(async function updateEvent(argv, token) {
  const name = argv.name as string;
  const fieldSpecs = (argv.field as string[] | undefined) ?? [];

  if (fieldSpecs.length === 0) {
    throw new Error('Provide at least one --field to add.');
  }

  const schema = Object.fromEntries(fieldSpecs.map(parseFieldArg));
  const result = await updateEventDefinition(token, name, schema);
  printMcpResult(result, argv);
});
