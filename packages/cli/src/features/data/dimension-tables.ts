import {
  createDimensionTable,
  DIMENSION_TABLES_PATH,
  getDimensionTable,
  listDimensionTables,
} from '@network/metrics-dimension-tables.js';
import {
  dimensionTableId,
  dimensionTableListOptions,
  dimensionTablePath,
  readDimensionTable,
} from './dimension-input.js';
import { executeDataRequest } from './request.js';

export async function listDimensionTablesCmd(argv: Record<string, unknown>): Promise<void> {
  const options = dimensionTableListOptions(argv);
  await executeDataRequest(argv, (token) => listDimensionTables(token, options), {
    dryRun: true,
    method: 'GET',
    path: DIMENSION_TABLES_PATH,
    params: options.params,
    all: options.all,
  });
}

export async function getDimensionTableCmd(argv: Record<string, unknown>): Promise<void> {
  const path = dimensionTablePath(argv.name);
  await executeDataRequest(argv, (token) => getDimensionTable(token, path), {
    dryRun: true,
    method: 'GET',
    path,
  });
}

export async function createDimensionTableCmd(argv: Record<string, unknown>): Promise<void> {
  const id = dimensionTableId(argv.id);
  const body = readDimensionTable(argv['from-file']);
  await executeDataRequest(argv, (token) => createDimensionTable(token, { body, id }), {
    dryRun: true,
    method: 'POST',
    path: DIMENSION_TABLES_PATH,
    params: id === undefined ? {} : { dimensionTableId: id },
    body,
  });
}
