import type { Argv } from 'yargs';
import { suggestColumns } from '@features/data/index.js';
import { safely } from '@utils/safely.js';

export const factTableSuggestionsCommand = {
  command: 'suggest-columns',
  describe:
    'Suggest column classifications from an explicitly approved schema (does not create a table)',
  builder(yargs: Argv) {
    return yargs
      .option('from-file', {
        type: 'string',
        demandOption: true,
        describe: 'JSON file containing only {schema: [{name, type?, repeated?}]} (no rows)',
      })
      .example(
        '$0 data fact-tables suggest-columns --from-file approved-schema.json',
        'Send the approved schema for advisory column classifications only',
      )
      .strict();
  },
  handler: safely(suggestColumns),
};
