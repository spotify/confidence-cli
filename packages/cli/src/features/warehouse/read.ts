import { executeDataRequest } from '@features/data/request.js';
import {
  getWarehouse,
  listWarehouses,
  warehouseListParams,
  type WarehouseListOptions,
} from '@network/metrics-warehouse.js';
import { requireString, resourcePath } from '@network/metrics-types.js';

export async function listWarehousesCmd(argv: Record<string, unknown>): Promise<void> {
  const pageSize = argv['page-size'];
  if (
    pageSize !== undefined &&
    (typeof pageSize !== 'number' || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000)
  ) {
    throw new Error('--page-size must be a positive integer no greater than 1000.');
  }
  const options: WarehouseListOptions = {
    pageSize,
    pageToken:
      argv['page-token'] === undefined
        ? undefined
        : requireString(argv['page-token'], '--page-token'),
    all: argv.all === true,
  };
  await executeDataRequest(argv, (token) => listWarehouses(token, options), {
    dryRun: true,
    method: 'GET',
    path: '/v1/dataWarehouses',
    params: warehouseListParams(options),
    all: options.all,
  });
}

export async function getWarehouseCmd(argv: Record<string, unknown>): Promise<void> {
  const name = requireString(argv.name, '--name');
  const path = resourcePath(name, 'dataWarehouses');
  await executeDataRequest(argv, (token) => getWarehouse(token, name), {
    dryRun: true,
    method: 'GET',
    path,
  });
}
