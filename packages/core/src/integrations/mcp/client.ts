import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types';
import { MCP_SERVERS, type McpServerName } from './servers.js';

type McpClientOpts = { accessToken?: string };
type McpConnection = AsyncDisposable & { client: Client };

async function connectMcpClient(
  serverName: McpServerName,
  opts?: McpClientOpts,
): Promise<McpConnection> {
  const server = MCP_SERVERS[serverName];
  const headers: Record<string, string> = { ...server.headers };

  if (opts?.accessToken) {
    headers['Authorization'] = `Bearer ${opts.accessToken}`;
  }

  const transport = new StreamableHTTPClientTransport(new URL(server.url), {
    requestInit: { headers },
  });

  const client = new Client({
    name: 'confidence-cli',
    version: '1.0.0',
  });

  await client.connect(transport);

  return {
    client,
    [Symbol.asyncDispose]: () => client.close(),
  };
}

function isTextContent(block: { type: string }): block is TextContent {
  return block.type === 'text';
}

function extractText(result: CallToolResult): string {
  return result.content
    .filter(isTextContent)
    .map((c) => c.text)
    .join('\n');
}

export async function callMcpTool(
  serverName: McpServerName,
  toolName: string,
  args: Record<string, unknown>,
  opts?: McpClientOpts,
): Promise<string> {
  await using conn = await connectMcpClient(serverName, opts);

  const result = (await conn.client.callTool({
    name: toolName,
    arguments: args,
  })) as CallToolResult;

  const text = extractText(result);

  if (result.isError) {
    throw new Error(text || 'MCP tool call failed');
  }

  return text;
}
