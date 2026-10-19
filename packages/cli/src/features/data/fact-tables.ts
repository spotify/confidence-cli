import {
  createFactTable,
  factTableListParams,
  getFactTable,
  listFactTables,
  type FactTableListOptions,
} from '@network/metrics-fact-tables.js';
import { requireString, resourcePath } from '@network/metrics-types.js';
import { readFactTable } from './fact-input.js';
import { executeDataRequest } from './request.js';

function positiveInteger(value: unknown, label: string, maximum: number): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    throw new Error(`${label} must be an integer between 1 and ${maximum}.`);
  }
  return value;
}

export async function listFactTablesCmd(argv: Record<string, unknown>): Promise<void> {
  const all = argv.all === true;
  const options: FactTableListOptions = {
    pageSize: positiveInteger(argv['page-size'], '--page-size', 2147483647),
    maxPages: positiveInteger(argv['max-pages'], '--max-pages', 1000),
    maxItems: positiveInteger(argv['max-items'], '--max-items', 100000),
  };
  if (all && (options.maxPages === undefined || options.maxItems === undefined)) {
    throw new Error('--all requires explicit --max-pages and --max-items bounds.');
  }
  if (!all && (options.maxPages !== undefined || options.maxItems !== undefined)) {
    throw new Error('--max-pages and --max-items require --all.');
  }
  for (const [key, option] of [
    ['page-token', 'pageToken'],
    ['filter', 'filter'],
    ['order-by', 'orderBy'],
  ] as const) {
    if (argv[key] !== undefined) options[option] = requireString(argv[key], `--${key}`);
  }
  if (argv['show-deleted'] !== undefined) {
    if (typeof argv['show-deleted'] !== 'boolean')
      throw new Error('--show-deleted must be a boolean.');
    options.showDeleted = argv['show-deleted'];
  }
  await executeDataRequest(argv, (token) => listFactTables(token, options), {
    method: 'GET',
    path: '/v1/factTables',
    params: factTableListParams(options),
    ...(all ? { maxPages: options.maxPages, maxItems: options.maxItems } : {}),
  });
}

export async function getFactTableCmd(argv: Record<string, unknown>): Promise<void> {
  const name = requireString(argv.name, 'name');
  const path = resourcePath(name, 'factTables');
  await executeDataRequest(argv, (token) => getFactTable(token, name), { method: 'GET', path });
}

export async function createFactTableCmd(argv: Record<string, unknown>): Promise<void> {
  const resource = readFactTable(argv['from-file']);
  const id = argv.id === undefined ? undefined : requireString(argv.id, '--id');
  if (id !== undefined) resourcePath(`factTables/${id}`, 'factTables');
  await executeDataRequest(argv, (token) => createFactTable(token, resource, id), {
    method: 'POST',
    path: '/v1/factTables',
    params: id === undefined ? {} : { factTableId: id },
    body: resource,
  });
}
