import { isDefined } from '@spotify-confidence/shared-kernel';
import { mcpCallTool, type CallToolResult } from '@spotify-confidence/core';
import { serverOpts } from './config.js';

export async function listEventDefinitions(
  token: string,
  opts?: { pageToken?: string },
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'listEventDefinitions', {
    pageToken: opts?.pageToken,
  });
}

export async function getEventDefinition(token: string, name: string): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'getEventDefinition', { name });
}

export async function createEventDefinition(
  token: string,
  eventDefinitionId: string,
  schema: Record<string, unknown>,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'createEventDefinition', {
    eventDefinitionId,
    schema: JSON.stringify(schema),
  });
}

export async function updateEventDefinition(
  token: string,
  name: string,
  schema: Record<string, unknown>,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'updateEventDefinition', {
    name,
    schema: JSON.stringify(schema),
  });
}

export async function deleteEventDefinition(token: string, name: string): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'deleteEventDefinition', { name });
}

export async function queryEventsUsage(
  token: string,
  name: string,
  opts?: { daysBack?: number },
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'queryEventsUsage', {
    eventDefinitionName: name,
    daysBack: isDefined(opts?.daysBack) ? String(opts.daysBack) : undefined,
  });
}
