import { createAssignmentTable } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withCrossCutting } from '@composition';
import { tryHandleMcpError, dryRunGuard } from '@utils/index.js';
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

const KEYS: (keyof AssignmentTableParams)[] = [
  'display-name',
  'sql',
  'entity-column',
  'timestamp-column',
  'exposure-key-column',
  'variant-key-column',
];

export const createAssignmentTableCmd = withCrossCutting(
  async function createAssignmentTableCmd(argv, token) {
    const params = resolveInput<AssignmentTableParams>(argv, KEYS);
    requireKeys(params, KEYS);

    const payload = {
      displayName: params['display-name'],
      sql: params.sql,
      entityColumn: params['entity-column'],
      timestampColumn: params['timestamp-column'],
      exposureKeyColumn: params['exposure-key-column'],
      variantKeyColumn: params['variant-key-column'],
    };
    if (dryRunGuard(argv, payload)) return;

    const result = await createAssignmentTable(token, payload);

    if (tryHandleMcpError(result)) return;
    printMcpResult(result, argv);
  },
);
