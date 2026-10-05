import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { McpClientOptions } from './types.js';

export type { CallToolResult };

export async function createMcpClient(opts: McpClientOptions): Promise<Client> {
  const client = new Client({ name: 'confidence-cli', version: opts.clientVersion ?? '0.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(opts.serverUrl), {
    requestInit: { headers: { Authorization: `Bearer ${opts.token}` } },
  });
  await client.connect(transport);
  return client;
}

export async function mcpCallTool(
  opts: McpClientOptions,
  toolName: string,
  args?: Record<string, unknown>,
): Promise<CallToolResult> {
  const client = await createMcpClient(opts);
  try {
    const result = await client.callTool({ name: toolName, arguments: args }, CallToolResultSchema);
    return result as CallToolResult;
  } finally {
    await client.close();
  }
}

export function parseToolJson<T>(result: CallToolResult): T {
  const text = extractText(result);
  return JSON.parse(text) as T;
}

export function extractText(result: CallToolResult): string {
  const raw = joinTextBlocks(result);
  const text = unwrapPotentiallyJsonEncodedString(raw);

  if (result.isError) {
    throw new Error(text || 'MCP tool call failed');
  }

  return text;
}

type TextBlock = Extract<CallToolResult['content'][number], { type: 'text' }>;

function joinTextBlocks(result: CallToolResult): string {
  return result.content
    .filter((c): c is TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('\n');
}

function unwrapPotentiallyJsonEncodedString(text: string): string {
  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      return JSON.parse(text) as string;
    } catch {
      return text;
    }
  }
  return text;
}
