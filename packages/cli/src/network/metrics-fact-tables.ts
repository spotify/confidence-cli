import type { ApiResponse } from '@spotify-confidence/core';
import { metricsRequest } from './metrics.js';
import { requireRecord, requireString, resourcePath } from './metrics-types.js';

export type FactTableListOptions = {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  showDeleted?: boolean;
  orderBy?: string;
  maxPages?: number;
  maxItems?: number;
};

export function factTableListParams(options: FactTableListOptions): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of ['pageSize', 'pageToken', 'filter', 'showDeleted', 'orderBy'] as const) {
    if (options[key] !== undefined) params[key] = String(options[key]);
  }
  return params;
}

/** Guard the resource envelope without restricting lifecycle or future response fields. */
function factTableResource(
  input: unknown,
  label: string,
  expectedName?: string,
): Record<string, unknown> {
  const resource = requireRecord(input, label);
  resourcePath(requireString(resource.name, `${label}.name`), 'factTables');
  if (expectedName !== undefined && resource.name !== expectedName) {
    throw new Error(`${label}.name does not match the requested resource.`);
  }
  return resource;
}

/** A single page by default; bounded traversal only when explicitly requested. */
export async function listFactTables(
  token: string,
  options: FactTableListOptions,
): Promise<ApiResponse<Record<string, unknown>>> {
  const tables: unknown[] = [];
  const seen = new Set<string>();
  let pageToken = options.pageToken;
  if (pageToken) seen.add(pageToken);
  for (let page = 0; page < (options.maxPages ?? 1); page++) {
    const remaining = options.maxItems === undefined ? undefined : options.maxItems - tables.length;
    const pageSize =
      remaining === undefined ? options.pageSize : Math.min(options.pageSize ?? 100, remaining);
    const response = await metricsRequest<unknown>(token, {
      path: '/v1/factTables',
      params: factTableListParams({ ...options, pageToken, pageSize }),
    });
    if (!response.ok) return response;
    const data = requireRecord(response.data, 'Fact table list response');
    const items = data.factTables === undefined ? [] : data.factTables;
    if (!Array.isArray(items))
      throw new Error('Fact table list response.factTables must be an array.');
    items.forEach((item, index) =>
      factTableResource(item, `Fact table list response.factTables[${index}]`),
    );
    if (data.nextPageToken !== undefined && typeof data.nextPageToken !== 'string') {
      throw new Error('Fact table list response.nextPageToken must be a string.');
    }
    if (options.maxPages === undefined) return { ok: true, data: { ...data, factTables: items } };
    tables.push(...items);
    if (options.maxItems !== undefined && tables.length > options.maxItems) {
      throw new Error('Fact table list exceeded --max-items; the service did not honor pageSize.');
    }
    pageToken = data.nextPageToken as string | undefined;
    if (pageToken && seen.has(pageToken))
      throw new Error('Fact table pagination returned a repeated page token.');
    if (!pageToken || page + 1 === options.maxPages || tables.length === options.maxItems) {
      return { ok: true, data: { ...data, factTables: tables } };
    }
    seen.add(pageToken);
  }
  throw new Error('Fact table pagination requires a positive page bound.');
}

export async function getFactTable(
  token: string,
  name: string,
): Promise<ApiResponse<Record<string, unknown>>> {
  const response = await metricsRequest<unknown>(token, { path: resourcePath(name, 'factTables') });
  if (!response.ok) return response;
  return { ok: true, data: factTableResource(response.data, 'Fact table get response', name) };
}

/** POST exactly once: a transport failure can leave the remote write outcome unknown. */
export async function createFactTable(
  token: string,
  resource: Record<string, unknown>,
  id?: string,
): Promise<ApiResponse<Record<string, unknown>>> {
  if (id !== undefined) resourcePath(`factTables/${id}`, 'factTables');
  try {
    const response = await metricsRequest<unknown>(token, {
      path: '/v1/factTables',
      method: 'POST',
      body: resource,
      params: id === undefined ? undefined : { factTableId: id },
    });
    if (!response.ok) {
      if (
        response.status === 0 ||
        (response.status >= 200 && response.status < 300) ||
        response.status >= 500
      ) {
        return unknownCreateOutcome(response.error.message, id);
      }
      return response;
    }
    return {
      ok: true,
      data: factTableResource(
        response.data,
        'Fact table create response',
        id === undefined ? undefined : `factTables/${id}`,
      ),
    };
  } catch (error) {
    return unknownCreateOutcome(
      error instanceof Error ? error.message : 'The create response could not be read.',
      id,
    );
  }
}

function unknownCreateOutcome(message: string, id?: string): ApiResponse<never> {
  const lookup =
    id === undefined
      ? 'fact-tables list/get'
      : `fact-tables get factTables/${id} or fact-tables list`;
  return {
    ok: false,
    status: 0,
    error: {
      code: 0,
      message: `${message} Create outcome is unknown; no retry was attempted. Check ${lookup} before retrying.`,
    },
  };
}
