import type { Argv } from 'yargs';
import { noop } from '@spotify-confidence/shared-kernel';
import { previewSql, showSqlJob } from '@features/data/sql.js';
import { showSqlSchema } from '@features/data/sql-schema.js';
import { safely } from '@utils/index.js';

export const sqlCommand = {
  command: 'sql <action>',
  describe: 'Preview SQL and inspect warehouse query jobs',
  builder(yargs: Argv) {
    return yargs
      .command(
        'preview',
        'Execute a bounded warehouse preview query (may incur warehouse costs)',
        (y: Argv) =>
          y
            .option('from-file', {
              type: 'string',
              demandOption: true,
              describe: 'JSON file containing only a query string',
            })
            .option('wait', {
              type: 'boolean',
              default: false,
              describe: 'Wait for the preview job to complete',
            })
            .option('timeout', {
              type: 'number',
              default: 60,
              describe: 'Maximum wait in seconds (positive, at most 3600)',
            }),
        safely(previewSql),
      )
      .command(
        'status',
        'Inspect a SQL job without starting or retrying it',
        (y: Argv) =>
          y.option('name', {
            type: 'string',
            demandOption: true,
            describe: 'Qualified sqlJobs/<id> resource name',
          }),
        safely(showSqlJob),
      )
      .command(
        'schema',
        'Read schema and issues only (sample rows are discarded)',
        (y: Argv) =>
          y.option('name', {
            type: 'string',
            demandOption: true,
            describe: 'Qualified sqlJobs/<id> resource name',
          }),
        safely(showSqlSchema),
      )
      .demandCommand(1)
      .strict();
  },
  handler: noop,
};
