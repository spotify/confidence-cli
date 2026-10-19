import type { Argv } from 'yargs';
import { noop } from '@spotify-confidence/shared-kernel';
import { factTablesCommand } from './data/fact-tables.js';
export const dataCommand = {
  command: 'data',
  describe: 'Work with Confidence data resources',
  builder(yargs: Argv) {
    return yargs
      .usage('$0 data <command> [options]')
      .command(factTablesCommand)
      .demandCommand(1, 'Run "confidence data --help" to see available commands.')
      .strict()
      .help();
  },
  handler: noop,
};
