import { getSqlSchema } from '@network/metrics-sql-schema.js';
import { requireString, resourcePath } from '@network/metrics-types.js';
import { executeDataRequest } from './request.js';

export async function showSqlSchema(argv: Record<string, unknown>): Promise<void> {
  const name = requireString(argv.name, '--name');
  const path = resourcePath(name, 'sqlJobs');
  await executeDataRequest(argv, (token) => getSqlSchema(token, name), {
    dryRun: true,
    operation: 'sql.schema',
    path: `${path}/sampleRows`,
    name,
  });
}
