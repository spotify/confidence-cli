import type { Argv } from 'yargs';
import { noop } from '@spotify-confidence/shared-kernel';
import { getEntityCmd, listEntitiesCmd } from '@features/data/index.js';
import { safely } from '@utils/safely.js';

export const entitiesCommand = {
  command: 'entities',
  describe: 'Read Confidence entities',
  builder(yargs: Argv) {
    return yargs
      .command(
        'list',
        'List entities',
        (y: Argv) =>
          y
            .option('page-size', {
              type: 'number',
              describe: 'Maximum entities per page (1–1000)',
            })
            .option('page-token', {
              type: 'string',
              describe: 'Opaque token from a previous list response',
            })
            .option('all', {
              type: 'boolean',
              default: false,
              describe: 'Fetch all remaining pages',
            }),
        safely(listEntitiesCmd),
      )
      .command(
        'get',
        'Get an entity by qualified resource name',
        (y: Argv) =>
          y.option('name', {
            type: 'string',
            demandOption: true,
            describe: 'Qualified entity name (entities/<id>)',
          }),
        safely(getEntityCmd),
      )
      .demandCommand(1, 'Available commands: list, get')
      .strict();
  },
  handler: noop,
};
