import { apiRequest } from '@spotify-confidence/core';
import type { Region, ApiResponse, PaginatedList } from '@spotify-confidence/core';
import type {
  EventDefinition,
  CreateEventRequest,
  TrackEventRequest,
  ValidateEventRequest,
  ValidateEventResponse,
} from './types.js';

const SERVICE = 'events';

export function listEventDefinitions(
  token: string,
  region: Region,
  opts?: { pageSize?: number; pageToken?: string },
): Promise<ApiResponse<PaginatedList<EventDefinition>>> {
  const params: Record<string, string> = {};
  if (opts?.pageSize) params['pageSize'] = String(opts.pageSize);
  if (opts?.pageToken) params['pageToken'] = opts.pageToken;

  return apiRequest({
    token,
    region,
    service: SERVICE,
    path: '/v1/events',
    params,
  });
}

export function getEventDefinition(
  token: string,
  region: Region,
  name: string,
): Promise<ApiResponse<EventDefinition>> {
  return apiRequest({
    token,
    region,
    service: SERVICE,
    path: `/v1/events/${encodeURIComponent(name)}`,
  });
}

export function createEventDefinition(
  token: string,
  region: Region,
  body: CreateEventRequest,
): Promise<ApiResponse<EventDefinition>> {
  return apiRequest({
    token,
    region,
    service: SERVICE,
    path: '/v1/events',
    method: 'POST',
    body,
  });
}

export function publishEvent(
  token: string,
  region: Region,
  body: TrackEventRequest,
): Promise<ApiResponse<Record<string, unknown>>> {
  return apiRequest({
    token,
    region,
    service: SERVICE,
    path: '/v1/events:publish',
    method: 'POST',
    body,
  });
}

export function validateEvent(
  token: string,
  region: Region,
  body: ValidateEventRequest,
): Promise<ApiResponse<ValidateEventResponse>> {
  return apiRequest({
    token,
    region,
    service: SERVICE,
    path: '/v1/events:validate',
    method: 'POST',
    body,
  });
}
