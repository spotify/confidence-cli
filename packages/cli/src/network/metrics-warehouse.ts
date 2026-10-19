import type { ApiResponse } from '@spotify-confidence/core';

import { metricsRequest } from './metrics.js';
import { isRecord, requireRecord, requireString, resourcePath } from './metrics-types.js';

export type Warehouse = Record<string, unknown> & { name: string };
export type WarehousePage = Record<string, unknown> & {
  dataWarehouses: Warehouse[];
  nextPageToken?: string;
};
export type WarehouseListOptions = {
  pageSize?: number;
  pageToken?: string;
  all: boolean;
};

// Bound aggregation even when a broken server keeps returning unique continuation tokens.
const MAX_WAREHOUSE_PAGES = 1000;

// Only expose public configuration fields from DataWarehouseConfig in metrics/v1/metrics.proto.
// In particular, never return Databricks clientSecret or Redshift secretAccessKey,
// even if a server accidentally includes these input-only fields in a read response.
const PUBLIC_CONFIG_FIELDS = {
  bigQueryConfig: [
    'gcpProjectId',
    'bigQueryLocation',
    'dataset',
    'serviceAccount',
    'processingProjectId',
    'interactiveProjectId',
    'exportJobsServiceAccount',
  ],
  dataBricksConfig: ['host', 'warehouseId', 'clientId', 'exposureSchema', 'resultsSchema'],
  redshiftConfig: ['exposureSchema', 'region', 'roleArn', 'cluster', 'database', 'dataApiEndpoint'],
  snowflakeConfig: [
    'account',
    'user',
    'authenticationKey',
    'role',
    'warehouse',
    'exposureDatabase',
    'exposureSchema',
  ],
} as const;

function publicFields(value: unknown, fields: readonly string[]): Record<string, unknown> {
  const record = requireRecord(value, 'Warehouse configuration');
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (record[field] !== undefined) {
      if (typeof record[field] !== 'string') {
        throw new Error('Invalid warehouse configuration response.');
      }
      result[field] = record[field];
    }
  }
  return result;
}

function publicConfig(value: unknown): Record<string, unknown> {
  const config = requireRecord(value, 'Warehouse config');
  const result: Record<string, unknown> = {};
  for (const [kind, fields] of Object.entries(PUBLIC_CONFIG_FIELDS)) {
    if (config[kind] !== undefined) result[kind] = publicFields(config[kind], fields);
  }
  if (isRecord(config.redshiftConfig)) {
    const redshift = requireRecord(result.redshiftConfig);
    if (config.redshiftConfig.credentialsSettings !== undefined) {
      redshift.credentialsSettings = publicFields(config.redshiftConfig.credentialsSettings, [
        'accessKeyId',
      ]);
    }
    if (config.redshiftConfig.webIdentitySettings !== undefined) {
      requireRecord(config.redshiftConfig.webIdentitySettings, 'Warehouse web identity settings');
      redshift.webIdentitySettings = {};
    }
  }
  return result;
}

function parseWarehouse(value: unknown): Warehouse {
  const warehouse = requireRecord(value, 'Data warehouse response');
  const name = requireString(warehouse.name, 'Data warehouse name');
  resourcePath(name, 'dataWarehouses');
  return {
    ...warehouse,
    name,
    ...(warehouse.config === undefined ? {} : { config: publicConfig(warehouse.config) }),
  };
}

function parsePage(value: unknown): WarehousePage {
  const page = requireRecord(value, 'Warehouse list response');
  // Protobuf JSON omits empty repeated fields unless default values are emitted.
  const warehouses = page.dataWarehouses === undefined ? [] : page.dataWarehouses;
  if (!Array.isArray(warehouses)) {
    throw new Error('Warehouse list response dataWarehouses must be an array.');
  }
  if (page.nextPageToken !== undefined && typeof page.nextPageToken !== 'string') {
    throw new Error('Warehouse list response nextPageToken must be a string.');
  }
  return {
    ...page,
    dataWarehouses: warehouses.map(parseWarehouse),
    ...(page.nextPageToken === undefined ? {} : { nextPageToken: page.nextPageToken }),
  };
}

export function warehouseListParams(options: WarehouseListOptions): Record<string, string> {
  return {
    ...(options.pageSize === undefined ? {} : { pageSize: String(options.pageSize) }),
    ...(options.pageToken === undefined ? {} : { pageToken: options.pageToken }),
  };
}

export async function listWarehouses(
  token: string,
  options: WarehouseListOptions,
): Promise<ApiResponse<WarehousePage>> {
  const seenTokens = new Set<string>();
  if (options.pageToken) seenTokens.add(options.pageToken);
  let pageToken = options.pageToken;
  const warehouses: Warehouse[] = [];
  let combined: WarehousePage = { dataWarehouses: warehouses };
  let pages = 0;
  do {
    if (pages >= MAX_WAREHOUSE_PAGES) {
      throw new Error(
        'Warehouse pagination exceeded the 1000-page safety limit. Use single-page requests instead.',
      );
    }
    pages++;
    const response = await metricsRequest<unknown>(token, {
      path: '/v1/dataWarehouses',
      params: warehouseListParams({ ...options, pageToken }),
    });
    if (!response.ok) return response;
    const page = parsePage(response.data);
    if (!options.all) return { ok: true, data: page };
    for (const warehouse of page.dataWarehouses) warehouses.push(warehouse);
    combined = {
      ...combined,
      ...page,
      dataWarehouses: warehouses,
      nextPageToken: page.nextPageToken ?? '',
    };
    pageToken = page.nextPageToken;
    if (pageToken) {
      if (seenTokens.has(pageToken)) {
        throw new Error('Warehouse pagination returned a repeated page token.');
      }
      seenTokens.add(pageToken);
    }
  } while (pageToken);
  return { ok: true, data: combined };
}

export async function getWarehouse(token: string, name: string): Promise<ApiResponse<Warehouse>> {
  const response = await metricsRequest<unknown>(token, {
    path: resourcePath(name, 'dataWarehouses'),
  });
  if (!response.ok) return response;
  const warehouse = parseWarehouse(response.data);
  if (warehouse.name !== name) {
    throw new Error('Data warehouse response name does not match the requested resource.');
  }
  return { ok: true, data: warehouse };
}
