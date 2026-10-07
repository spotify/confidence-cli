import type { Argv } from 'yargs';
import { noop } from '@spotify-confidence/shared-kernel';
import {
  validateConfig,
  createWarehouseCmd,
  createFlagAppliedConnectionCmd,
  createEventConnectionCmd,
  createAssignmentTableCmd,
  createCryptoKeyCmd,
} from '@features/warehouse/index.js';
import { safely } from '@utils/index.js';

const WAREHOUSE_TYPES = ['bigquery', 'snowflake', 'databricks', 'redshift'] as const;

function warehouseTypeBuilder(yy: Argv): Argv {
  return yy
    .option('warehouse-type', {
      type: 'string',
      choices: WAREHOUSE_TYPES,
      describe: 'Data warehouse type',
    })
    .option('config-json', {
      type: 'string',
      describe: 'Warehouse-specific configuration as JSON string',
    })
    .option('from-file', {
      type: 'string',
      describe: 'Read params from JSON file',
    })
    .check((argv) => {
      if (!argv['from-file'] && (!argv['warehouse-type'] || !argv['config-json'])) {
        throw new Error('--warehouse-type and --config-json are required (or use --from-file)');
      }
      return true;
    });
}

export const warehouseCommand = {
  command: 'warehouse <action>',
  describe: 'Manage data warehouse connections',
  builder(yargs: Argv) {
    return yargs
      .command(
        'validate',
        'Validate warehouse configuration',
        warehouseTypeBuilder,
        safely(validateConfig),
      )
      .command(
        'create',
        'Create a data warehouse',
        warehouseTypeBuilder,
        safely(createWarehouseCmd),
      )
      .command('connector <action>', 'Manage data connectors', (y: Argv) =>
        y
          .command(
            'create-flag-applied',
            'Create flag assignment connector',
            warehouseTypeBuilder,
            safely(createFlagAppliedConnectionCmd),
          )
          .command(
            'create-event',
            'Create event data connector',
            warehouseTypeBuilder,
            safely(createEventConnectionCmd),
          )
          .demandCommand(1, 'Available actions: create-flag-applied, create-event')
          .strict(),
      )
      .command('assignment-table <action>', 'Manage assignment tables', (y: Argv) =>
        y
          .command(
            'create',
            'Create an assignment table',
            (yy: Argv) =>
              yy
                .option('display-name', {
                  type: 'string',
                  describe: 'Table display name',
                })
                .option('sql', {
                  type: 'string',
                  describe: 'SQL query defining the table',
                })
                .option('entity-column', {
                  type: 'string',
                  describe: 'Column name for entity/targeting key',
                })
                .option('timestamp-column', {
                  type: 'string',
                  describe: 'Column name for timestamps',
                })
                .option('exposure-key-column', {
                  type: 'string',
                  describe: 'Column name for exposure key',
                })
                .option('variant-key-column', {
                  type: 'string',
                  describe: 'Column name for variant key',
                })
                .option('from-file', {
                  type: 'string',
                  describe: 'Read params from JSON file',
                })
                .check((argv) => {
                  if (
                    !argv['from-file'] &&
                    (!argv['display-name'] ||
                      !argv.sql ||
                      !argv['entity-column'] ||
                      !argv['timestamp-column'] ||
                      !argv['exposure-key-column'] ||
                      !argv['variant-key-column'])
                  ) {
                    throw new Error(
                      '--display-name, --sql, --entity-column, --timestamp-column, --exposure-key-column, and --variant-key-column are required (or use --from-file)',
                    );
                  }
                  return true;
                }),
            safely(createAssignmentTableCmd),
          )
          .demandCommand(1, 'Available actions: create')
          .strict(),
      )
      .command('crypto-key <action>', 'Manage crypto keys (Snowflake)', (y: Argv) =>
        y
          .command(
            'create',
            'Create a crypto key',
            (yy: Argv) =>
              yy
                .option('crypto-key-id', {
                  type: 'string',
                  describe: 'Key identifier (e.g. snowflake-key)',
                })
                .option('from-file', {
                  type: 'string',
                  describe: 'Read params from JSON file',
                })
                .check((argv) => {
                  if (!argv['from-file'] && !argv['crypto-key-id']) {
                    throw new Error('--crypto-key-id is required (or use --from-file)');
                  }
                  return true;
                }),
            safely(createCryptoKeyCmd),
          )
          .demandCommand(1, 'Available actions: create')
          .strict(),
      )
      .demandCommand(
        1,
        'Available actions: validate, create, connector, assignment-table, crypto-key. Run "confidence warehouse --help" for details.',
      )
      .strict();
  },
  handler: noop,
};
