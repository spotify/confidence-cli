import type { JsonObject } from '@spotify-confidence/shared-kernel';
import {
  apiRequest,
  extractRegion,
  mcpCallTool,
  type ApiResponse,
  type CallToolResult,
} from '@spotify-confidence/core';
import { serverOpts } from './config.js';

function restOpts(token: string) {
  return { token, region: extractRegion(token), service: 'flags' } as const;
}

type FlagVariant = {
  name: string;
  displayName?: string;
  description?: string;
  value?: JsonObject;
};

type FlagRule = {
  name: string;
  enabled?: boolean;
  assignmentSpec?: JsonObject;
  targetingKeySelector?: string;
};

type FlagResource = {
  name: string;
  flagId?: string;
  displayName?: string;
  description?: string;
  enabled?: boolean;
  archived?: boolean;
  schema?: JsonObject;
  variants?: FlagVariant[];
  rules?: FlagRule[];
  createTime?: string;
  updateTime?: string;
};

type FlagListResponse = {
  flags: FlagResource[];
  nextPageToken?: string;
};

export type { FlagResource, FlagVariant, FlagRule, FlagListResponse };

export async function listFlags(
  token: string,
  opts?: { pageToken?: string },
): Promise<ApiResponse<FlagListResponse>> {
  const params: Record<string, string> = {};
  if (opts?.pageToken) params.page_token = opts.pageToken;

  return apiRequest<FlagListResponse>({
    ...restOpts(token),
    path: '/v1/flags',
    params: Object.keys(params).length > 0 ? params : undefined,
  });
}

export async function getFlag(token: string, flagKey: string): Promise<ApiResponse<FlagResource>> {
  return apiRequest<FlagResource>({
    ...restOpts(token),
    path: `/v1/flags/${encodeURIComponent(flagKey)}`,
  });
}

export async function createFlag(
  token: string,
  flagKey: string,
  opts?: { description?: string; variants?: string[]; client?: string },
): Promise<CallToolResult> {
  const args: JsonObject = { flagName: flagKey };
  if (opts?.client) args.clientName = opts.client;
  if (opts?.description) args.description = opts.description;
  if (opts?.variants) {
    args.variants = JSON.stringify(opts.variants.map((v) => ({ name: v, value: {} })));
  }

  return mcpCallTool(serverOpts(token), 'createFlag', args);
}

export async function updateFlag(
  token: string,
  flagKey: string,
  body: JsonObject,
): Promise<ApiResponse<FlagResource>> {
  return apiRequest<FlagResource>({
    ...restOpts(token),
    path: `/v1/flags/${encodeURIComponent(flagKey)}`,
    method: 'PATCH',
    body,
    params: { update_mask: Object.keys(body).join(',') },
  });
}

export async function toggleFlag(
  token: string,
  flagKey: string,
  opts: { enabled: boolean; client: string },
): Promise<CallToolResult> {
  const tool = opts.enabled ? 'addFlagToClient' : 'removeFlagFromClient';
  return mcpCallTool(serverOpts(token), tool, {
    flagName: flagKey,
    clientName: opts.client,
  });
}

export async function resolveFlag(
  token: string,
  flagKey: string,
  opts: { entity: string; entityValue: string; client: string; context?: Record<string, string> },
): Promise<CallToolResult> {
  const args: JsonObject = {
    flagName: flagKey,
    clientName: opts.client,
    entity: opts.entity,
    entityValue: opts.entityValue,
  };
  if (opts.context) args.context = JSON.stringify(opts.context);

  return mcpCallTool(serverOpts(token), 'resolveFlag', args);
}

export async function addTargetingRule(
  token: string,
  flagKey: string,
  rule: { variantAllocations: Record<string, number>; targetingKey?: string },
): Promise<CallToolResult> {
  const args: JsonObject = {
    flagName: flagKey,
    variantAllocations: JSON.stringify(rule.variantAllocations),
  };
  if (rule.targetingKey) args.targetingKey = rule.targetingKey;

  return mcpCallTool(serverOpts(token), 'addTargetingRule', args);
}

export async function archiveFlag(
  token: string,
  flagKey: string,
): Promise<ApiResponse<FlagResource>> {
  return apiRequest<FlagResource>({
    ...restOpts(token),
    path: `/v1/flags/${encodeURIComponent(flagKey)}:archive`,
    method: 'POST',
  });
}
