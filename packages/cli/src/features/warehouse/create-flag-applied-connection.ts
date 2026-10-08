import { ensureJsonString, validateJsonString } from '@spotify-confidence/core';
import { createFlagAppliedConnection } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withAuth, tryHandleMcpError } from '@utils/index.js';
import { resolveInput } from '@input/index.js';
import { requireKeys } from '@utils/validation.js';
import type { WarehouseTypeParams } from './types.js';
import { validateWarehouseType } from './utils.js';

export const createFlagAppliedConnectionCmd = withAuth(
  async function createFlagAppliedConnectionCmd(argv, token) {
    const params = resolveInput<WarehouseTypeParams>(argv, ['warehouse-type', 'config-json']);
    requireKeys(params, ['warehouse-type', 'config-json']);

    const warehouseType = validateWarehouseType(params['warehouse-type']);
    const configJson = validateJsonString(ensureJsonString(params['config-json']));

    const result = await createFlagAppliedConnection(token, warehouseType, configJson);

    if (tryHandleMcpError(result)) return;
    printMcpResult(result, argv);
  },
);
