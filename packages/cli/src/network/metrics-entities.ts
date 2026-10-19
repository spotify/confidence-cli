import type { ApiResponse } from '@spotify-confidence/core';
import { metricsRequest } from './metrics.js';
import { requireRecord, requireString, resourcePath } from './metrics-types.js';

type Entity = Record<string, unknown> & { name: string };
type EntityList = Record<string, unknown> & { entities: Entity[]; nextPageToken: string };
type ListOptions = {
  pageSize?: number;
  pageToken?: string;
  all?: boolean;
  /** Optional lower safety cap for programmatic callers; cannot raise the hard limit. */
  maxPages?: number;
};

const MAX_ENTITY_LIST_PAGES = 1000;

function readEntity(value: unknown): Entity {
  const entity = requireRecord(value, 'Entity response');
  const name = requireString(entity.name, 'Entity response name');
  resourcePath(name, 'entities');
  return { ...entity, name };
}

function readEntityList(value: unknown): EntityList {
  const response = requireRecord(value, 'Entities response');
  // Proto JSON may omit empty repeated fields and default-valued strings.
  const entities = response.entities === undefined ? [] : response.entities;
  if (!Array.isArray(entities)) throw new Error('Entities response entities must be an array.');
  const nextPageToken = response.nextPageToken === undefined ? '' : response.nextPageToken;
  if (typeof nextPageToken !== 'string') {
    throw new Error('Entities response nextPageToken must be a string.');
  }
  return { ...response, entities: entities.map(readEntity), nextPageToken };
}

export async function listEntities(
  token: string,
  options: ListOptions,
): Promise<ApiResponse<EntityList>> {
  const maxPages = options.maxPages ?? MAX_ENTITY_LIST_PAGES;
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > MAX_ENTITY_LIST_PAGES) {
    throw new Error(
      `Entities page limit must be an integer between 1 and ${MAX_ENTITY_LIST_PAGES}.`,
    );
  }
  const entities: Entity[] = [];
  let data: EntityList = { entities, nextPageToken: '' };
  const seen = new Set<string>();
  let pageToken = options.pageToken;
  if (pageToken) seen.add(pageToken);

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    const params: Record<string, string> = {};
    if (options.pageSize !== undefined) params.pageSize = String(options.pageSize);
    if (pageToken !== undefined) params.pageToken = pageToken;
    const result = await metricsRequest<unknown>(token, { path: '/v1/entities', params });
    if (!result.ok) return result;

    const page = readEntityList(result.data);
    if (!options.all) return { ok: true, data: page };
    entities.push(...page.entities);
    // Retain unknown page fields; the latest value wins when pages repeat a field.
    data = { ...data, ...page, entities };
    if (!page.nextPageToken) {
      return { ok: true, data };
    }
    if (seen.has(page.nextPageToken)) {
      throw new Error('Entities pagination returned a repeated page token.');
    }
    seen.add(page.nextPageToken);
    pageToken = page.nextPageToken;
  }
  throw new Error(`Entities pagination exceeded the ${maxPages}-page limit.`);
}

export async function getEntity(token: string, name: string): Promise<ApiResponse<Entity>> {
  const result = await metricsRequest<unknown>(token, { path: resourcePath(name, 'entities') });
  if (!result.ok) return result;
  const entity = readEntity(result.data);
  if (entity.name !== name) {
    throw new Error('Entity response name does not match the requested resource name.');
  }
  return { ok: true, data: entity };
}
