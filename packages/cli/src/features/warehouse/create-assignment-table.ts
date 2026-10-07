import { createAssignmentTable } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withAuth, tryHandleMcpError } from '@utils/index.js';
import { resolveInput } from '@input/index.js';
import { requireKeys } from '@utils/validation.js';

type AssignmentTableParams = {
  'display-name': string;
  sql: string;
  'entity-column': string;
  'timestamp-column': string;
  'exposure-key-column': string;
  'variant-key-column': string;
};

export const createAssignmentTableCmd = withAuth(
  async function createAssignmentTableCmd(argv, token) {
    const params = resolveInput<AssignmentTableParams>(argv, [
      'display-name',
      'sql',
      'entity-column',
      'timestamp-column',
      'exposure-key-column',
      'variant-key-column',
    ]);
    requireKeys(params, [
      'display-name',
      'sql',
      'entity-column',
      'timestamp-column',
      'exposure-key-column',
      'variant-key-column',
    ]);

    const result = await createAssignmentTable(token, {
      displayName: params['display-name'],
      sql: params.sql,
      entityColumn: params['entity-column'],
      timestampColumn: params['timestamp-column'],
      exposureKeyColumn: params['exposure-key-column'],
      variantKeyColumn: params['variant-key-column'],
    });
    if (tryHandleMcpError(result)) return;
    printMcpResult(result, argv);
  },
);
