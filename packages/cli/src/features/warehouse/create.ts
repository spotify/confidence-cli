import { ensureJsonString } from '@spotify-confidence/shared-kernel';
import { createWarehouse } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withAuth, tryHandleMcpError } from '@utils/index.js';
import { resolveInput } from '@input/index.js';
import { requireKeys } from '@utils/validation.js';
import type { WarehouseTypeParams } from './types.js';
import { validateWarehouseType } from './utils.js';

export const createWarehouseCmd = withAuth(async function createWarehouseCmd(argv, token) {
  const params = resolveInput<WarehouseTypeParams>(argv, ['warehouse-type', 'config-json']);
  requireKeys(params, ['warehouse-type', 'config-json']);
  validateWarehouseType(params['warehouse-type']);

  const result = await createWarehouse(
    token,
    params['warehouse-type'],
    ensureJsonString(params['config-json']),
  );

  if (tryHandleMcpError(result)) return;
  printMcpResult(result, argv);
});
