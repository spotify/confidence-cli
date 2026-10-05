import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { McpClientOptions } from './types.js';

export type { CallToolResult };

export async function createMcpClient(opts: McpClientOptions): Promise<Client> {
  const client = new Client({ name: 'confidence-cli', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(opts.serverUrl), {
    requestInit: {
      headers: { Authorization: `Bearer ${opts.token}` },
    },
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

export function extractText(result: CallToolResult): string {
  return result.content
    .filter(
      (c): c is Extract<CallToolResult['content'][number], { type: 'text' }> => c.type === 'text',
    )
    .map((c) => c.text)
    .join('\n');
}

export function parseToolJson<T>(result: CallToolResult): T {
  const text = extractText(result);
  return JSON.parse(text) as T;
}
