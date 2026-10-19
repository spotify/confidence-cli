import type { Argv } from 'yargs';
import { noop } from '@spotify-confidence/shared-kernel';
import {
  createDimensionTableCmd,
  getDimensionTableCmd,
  listDimensionTablesCmd,
} from '@features/data/index.js';
import { safely } from '@utils/index.js';

export const dimensionTablesCommand = {
  command: 'dimension-tables',
  describe: 'List, inspect, and create dimension tables',
  builder(yargs: Argv) {
    return yargs
      .command(
        'list',
        'List dimension tables',
        (y: Argv) =>
          y
            .option('page-size', { type: 'number', describe: 'Maximum number of tables per page' })
            .option('page-token', { type: 'string', describe: 'Token for the next page' })
            .option('filter', { type: 'string', describe: 'Lucene query string filter' })
            .option('order-by', { type: 'string', describe: 'Sort fields, e.g. displayName:asc' })
            .option('show-deleted', {
              type: 'boolean',
              describe: 'Include deleted dimension tables',
            })
            .option('all', { type: 'boolean', describe: 'Fetch all pages' }),
        safely(listDimensionTablesCmd),
      )
      .command(
        'get [name]',
        'Get a dimension table, including its current state and errors',
        (y: Argv) =>
          y
            .positional('name', { type: 'string', describe: 'ID or dimensionTables/<id>' })
            .option('name', {
              type: 'string',
              demandOption: true,
              describe: 'ID or dimensionTables/<id> (or supply it positionally)',
            }),
        safely(getDimensionTableCmd),
      )
      .command(
        'create',
        'Create one dimension table from a canonical resource JSON file',
        (y: Argv) =>
          y
            .option('from-file', {
              type: 'string',
              demandOption: true,
              describe: 'DimensionTable resource JSON file (not a request wrapper)',
            })
            .option('id', { type: 'string', describe: 'Optional ID for the new dimension table' }),
        safely(createDimensionTableCmd),
      )
      .demandCommand(1, 'Available actions: list, get, create')
      .strict()
      .help();
  },
  handler: noop,
};
