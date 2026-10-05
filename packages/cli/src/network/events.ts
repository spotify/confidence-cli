import {
  mcpCallTool,
  parseToolJson,
  MCP_SERVERS,
  type McpClientOptions,
  type CallToolResult,
} from '@spotify-confidence/core';
import type { EventDefinition, CreateEventRequest, ValidateEventResponse } from './types.js';

function serverOpts(token: string): McpClientOptions {
  return { serverUrl: MCP_SERVERS['confidence-flags'].url, token };
}

export async function listEventDefinitions(
  token: string,
  opts?: { pageSize?: number; pageToken?: string },
): Promise<EventDefinition[]> {
  const result = await mcpCallTool(serverOpts(token), 'list-events', {
    pageSize: opts?.pageSize,
    pageToken: opts?.pageToken,
  });
  return parseToolJson<EventDefinition[]>(result);
}

export async function getEventDefinition(token: string, name: string): Promise<EventDefinition> {
  const result = await mcpCallTool(serverOpts(token), 'get-event', { name });
  return parseToolJson<EventDefinition>(result);
}

export async function createEventDefinition(
  token: string,
  body: CreateEventRequest,
): Promise<EventDefinition> {
  const result = await mcpCallTool(
    serverOpts(token),
    'create-event',
    body as Record<string, unknown>,
  );
  return parseToolJson<EventDefinition>(result);
}

export async function publishEvent(
  token: string,
  event: { eventDefinition: string; payload: Record<string, unknown> },
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'track-event', event);
}

export async function validateEvent(
  token: string,
  event: { eventDefinition: string; payload: Record<string, unknown> },
): Promise<ValidateEventResponse> {
  const result = await mcpCallTool(serverOpts(token), 'validate-event', event);
  return parseToolJson<ValidateEventResponse>(result);
}
