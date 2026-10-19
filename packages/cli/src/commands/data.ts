import type { Argv } from 'yargs';
import { noop } from '@spotify-confidence/shared-kernel';
import { dimensionTablesCommand } from './data/dimension-tables.js';

export const dataCommand = {
  command: 'data',
  describe: 'Work with Confidence data resources',
  builder(yargs: Argv) {
    return yargs
      .usage('$0 data <command> [options]')
      .command(dimensionTablesCommand)
      .demandCommand(1, 'Run "confidence data --help" to see available commands.')
      .strict()
      .help();
  },
  handler: noop,
};
