import { getEntity, listEntities } from '@network/metrics-entities.js';
import { requireString, resourcePath } from '@network/metrics-types.js';
import { executeDataRequest } from './request.js';

export async function listEntitiesCmd(argv: Record<string, unknown>): Promise<void> {
  const pageSize = argv['page-size'];
  if (
    pageSize !== undefined &&
    (typeof pageSize !== 'number' || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000)
  ) {
    throw new Error('--page-size must be a positive integer no greater than 1000.');
  }
  const pageToken = argv['page-token'];
  if (pageToken !== undefined && typeof pageToken !== 'string') {
    throw new Error('--page-token must be a string.');
  }
  const all = argv.all;
  if (all !== undefined && typeof all !== 'boolean') {
    throw new Error('--all must be a boolean.');
  }
  const params: Record<string, string> = {};
  if (pageSize !== undefined) params.pageSize = String(pageSize);
  if (pageToken !== undefined) params.pageToken = pageToken;

  await executeDataRequest(argv, (token) => listEntities(token, { pageSize, pageToken, all }), {
    dryRun: true,
    method: 'GET',
    path: '/v1/entities',
    params,
    all: all ?? false,
  });
}

export async function getEntityCmd(argv: Record<string, unknown>): Promise<void> {
  const name = requireString(argv.name, '--name');
  const path = resourcePath(name, 'entities');

  await executeDataRequest(argv, (token) => getEntity(token, name), {
    dryRun: true,
    method: 'GET',
    path,
  });
}
