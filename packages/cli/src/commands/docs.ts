import type { Argv } from 'yargs';
import { searchDocs, grepDocs, readDocs } from '@features/docs/index.js';
import { safely } from '@utils/index.js';

export const docsCommand = {
  command: 'docs <action>',
  describe: 'Search and read Confidence documentation',
  builder(yargs: Argv) {
    return yargs
      .command(
        'search <query>',
        'Search Confidence documentation',
        (y: Argv) =>
          y
            .positional('query', { type: 'string', demandOption: true })
            .option('page-token', { type: 'string', describe: 'Pagination token' }),
        safely(searchDocs),
      )
      .command(
        'grep <pattern>',
        'Grep through documentation',
        (y: Argv) => y.positional('pattern', { type: 'string', demandOption: true }),
        safely(grepDocs),
      )
      .command(
        'read <page>',
        'Read a docs page in the terminal',
        (y: Argv) => y.positional('page', { type: 'string', demandOption: true }),
        safely(readDocs),
      )
      .demandCommand(1)
      .strict();
  },
  handler() {},
};
