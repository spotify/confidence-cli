import { ensureJsonString } from '@spotify-confidence/shared-kernel';
import { createEventConnection } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withAuth, tryHandleMcpError } from '@utils/index.js';
import { resolveInput } from '@input/index.js';
import { requireKeys } from '@utils/validation.js';
import type { WarehouseTypeParams } from './types.js';

export const createEventConnectionCmd = withAuth(
  async function createEventConnectionCmd(argv, token) {
    const params = resolveInput<WarehouseTypeParams>(argv, ['warehouse-type', 'config-json']);
    requireKeys(params, ['warehouse-type', 'config-json']);

    const result = await createEventConnection(
      token,
      params['warehouse-type'],
      ensureJsonString(params['config-json']),
    );

    if (tryHandleMcpError(result)) return;
    printMcpResult(result, argv);
  },
);
