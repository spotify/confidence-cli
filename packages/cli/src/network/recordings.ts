import { mcpCallTool, type CallToolResult } from '@spotify-confidence/core';
import { serverOpts } from './config.js';

export async function listRecordingPolicies(
  token: string,
  opts?: { pageToken?: string },
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'listRecordingPolicies', {
    pageToken: opts?.pageToken,
  });
}

export async function createRecordingPolicy(
  token: string,
  displayName: string,
  clientName: string,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'createRecordingPolicy', {
    displayName,
    clientName,
  });
}

export async function getRecordingPolicy(
  token: string,
  recordingPolicy: string,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'getRecordingPolicy', {
    recordingPolicy,
  });
}

type AddRecordingRuleParams = {
  recordingPolicy: string;
  displayName: string;
  targetingKeySelector: string;
  stableAudiencePercentage: number;
  sessionSampleRate: number;
  enabled: boolean;
};

export async function addRecordingRule(
  token: string,
  params: AddRecordingRuleParams,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'addRecordingRule', params);
}

export async function setRecordingRuleEnabled(
  token: string,
  rule: string,
  enabled: boolean,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'setRecordingRuleEnabled', {
    recordingRule: rule,
    enabled,
  });
}

export async function getContextSchema(
  token: string,
  clientDisplayName: string,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'getContextSchema', {
    clientName: clientDisplayName,
  });
}

type AddContextFieldParams = {
  fieldName: string;
  fieldType: string;
  displayName?: string;
  isEntity: boolean;
  entityReference?: string;
  clients: string[];
};

export async function addContextField(
  token: string,
  params: AddContextFieldParams,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'addContextField', {
    fieldName: params.fieldName,
    fieldType: params.fieldType,
    ...(params.displayName ? { displayName: params.displayName } : {}),
    isEntity: String(params.isEntity),
    ...(params.entityReference ? { entityReference: params.entityReference } : {}),
    ...(params.clients.length > 0 ? { clients: params.clients } : {}),
  });
}
