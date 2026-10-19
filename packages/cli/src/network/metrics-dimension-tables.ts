import type { ApiFailure, ApiResponse } from '@spotify-confidence/core';
import { metricsRequest } from './metrics.js';
import { requireRecord, requireString, resourcePath } from './metrics-types.js';

export const DIMENSION_TABLES_PATH = '/v1/dimensionTables';
const MAX_DIMENSION_TABLE_PAGES = 1000;

type Resource = Record<string, unknown>;
type DimensionTablePage = Resource & { dimensionTables: Resource[]; nextPageToken?: string };

function dimensionTable(value: unknown, expectedPath?: string): Resource {
  const resource = requireRecord(value, 'Dimension table response');
  const path = resourcePath(
    requireString(resource.name, 'Dimension table response.name'),
    'dimensionTables',
  );
  if (expectedPath !== undefined && path !== expectedPath) {
    throw new Error('Dimension table response.name does not match the requested resource.');
  }
  return resource;
}

function dimensionTablePage(value: unknown): DimensionTablePage {
  const page = requireRecord(value, 'Dimension table list response');
  // Protobuf JSON can omit an empty repeated field, but not replace it with null.
  const tables = page.dimensionTables === undefined ? [] : page.dimensionTables;
  if (!Array.isArray(tables)) {
    throw new Error('Dimension table list response.dimensionTables must be an array.');
  }
  if (page.nextPageToken !== undefined && typeof page.nextPageToken !== 'string') {
    throw new Error('Dimension table list response.nextPageToken must be a string.');
  }
  return { ...page, dimensionTables: tables.map((table) => dimensionTable(table)) };
}

export async function listDimensionTables(
  token: string,
  options: { params: Record<string, string>; all: boolean },
): Promise<ApiResponse<DimensionTablePage>> {
  const params = { ...options.params };
  const seen = new Set<string>();
  if (params.pageToken) seen.add(params.pageToken);
  const tables: Resource[] = [];
  for (let pageCount = 0; pageCount < MAX_DIMENSION_TABLE_PAGES; pageCount++) {
    const result = await metricsRequest<unknown>(token, { path: DIMENSION_TABLES_PATH, params });
    if (!result.ok) return result;
    const page = dimensionTablePage(result.data);
    if (!options.all) return { ok: true, data: page };
    tables.push(...page.dimensionTables);
    if (!page.nextPageToken) {
      return { ok: true, data: { ...page, dimensionTables: tables, nextPageToken: '' } };
    }
    if (seen.has(page.nextPageToken))
      throw new Error('Dimension table pagination repeated a page token.');
    seen.add(page.nextPageToken);
    params.pageToken = page.nextPageToken;
  }
  throw new Error(
    `Dimension table pagination exceeded the ${MAX_DIMENSION_TABLE_PAGES}-page limit. ` +
      'No partial results returned; narrow the filter or use single-page requests.',
  );
}

export async function getDimensionTable(
  token: string,
  path: string,
): Promise<ApiResponse<Resource>> {
  const result = await metricsRequest<unknown>(token, { path });
  return result.ok ? { ok: true, data: dimensionTable(result.data, path) } : result;
}

function unknownCreateOutcome(failure: ApiFailure, id?: string): ApiFailure {
  const guidance =
    id === undefined
      ? 'Check existing dimension tables before retrying.'
      : `Requested --id "${id}"; check with confidence data dimension-tables get ${id} before retrying.`;
  return {
    ...failure,
    error: {
      ...failure.error,
      message:
        `${failure.error.message} Creation outcome is unknown: the dimension table may have been created. ` +
        `Do not automatically retry. ${guidance}`,
    },
  };
}

export async function createDimensionTable(
  token: string,
  options: { body: Resource; id?: string },
): Promise<ApiResponse<Resource>> {
  const result = await metricsRequest<unknown>(token, {
    method: 'POST',
    path: DIMENSION_TABLES_PATH,
    body: options.body,
    params: options.id === undefined ? undefined : { dimensionTableId: options.id },
  });
  if (!result.ok) {
    const unknownOutcome =
      result.status === 0 || result.status >= 500 || (result.status >= 200 && result.status < 300);
    return unknownOutcome ? unknownCreateOutcome(result, options.id) : result;
  }
  try {
    const expectedPath =
      options.id === undefined ? undefined : `${DIMENSION_TABLES_PATH}/${options.id}`;
    return { ok: true, data: dimensionTable(result.data, expectedPath) };
  } catch (err) {
    return unknownCreateOutcome(
      {
        ok: false,
        status: 0,
        error: {
          code: 0,
          message: err instanceof Error ? err.message : 'Invalid dimension table response.',
        },
      },
      options.id,
    );
  }
}
