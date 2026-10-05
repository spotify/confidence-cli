import {
  mcpCallTool,
  extractText,
  MCP_SERVERS,
  type McpClientOptions,
} from '@spotify-confidence/core';

function serverOpts(token: string): McpClientOptions {
  return { serverUrl: MCP_SERVERS['confidence-flags'].url, token };
}

export async function listEventDefinitions(
  token: string,
  opts?: { pageToken?: string },
): Promise<string> {
  const result = await mcpCallTool(serverOpts(token), 'listEventDefinitions', {
    pageToken: opts?.pageToken,
  });
  return extractText(result);
}

export async function getEventDefinition(token: string, name: string): Promise<string> {
  const result = await mcpCallTool(serverOpts(token), 'getEventDefinition', { name });
  return extractText(result);
}

export async function createEventDefinition(
  token: string,
  eventDefinitionId: string,
  schema: Record<string, unknown>,
): Promise<string> {
  const result = await mcpCallTool(serverOpts(token), 'createEventDefinition', {
    eventDefinitionId,
    schema: JSON.stringify(schema),
  });
  return extractText(result);
}

export async function updateEventDefinition(
  token: string,
  name: string,
  schema: Record<string, unknown>,
): Promise<string> {
  const result = await mcpCallTool(serverOpts(token), 'updateEventDefinition', {
    name,
    schema: JSON.stringify(schema),
  });
  return extractText(result);
}

export async function deleteEventDefinition(token: string, name: string): Promise<string> {
  const result = await mcpCallTool(serverOpts(token), 'deleteEventDefinition', { name });
  return extractText(result);
}

export async function queryEventsUsage(
  token: string,
  name: string,
  opts?: { daysBack?: number },
): Promise<string> {
  const result = await mcpCallTool(serverOpts(token), 'queryEventsUsage', {
    eventDefinitionName: name,
    daysBack: opts?.daysBack ? String(opts.daysBack) : undefined,
  });
  return extractText(result);
}
