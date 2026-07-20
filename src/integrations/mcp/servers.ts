export const MCP_SERVERS = {
  'confidence-flags': {
    type: 'http' as const,
    url: 'https://mcp.confidence.dev/mcp/flags',
    headers: { 'x-confidence-mcp-consumer': 'plugin' },
  },
  'confidence-docs': {
    type: 'http' as const,
    url: 'https://mcp.confidence.dev/mcp/docs',
    headers: { 'x-confidence-mcp-consumer': 'plugin' },
  },
} as const;

export type McpServerName = keyof typeof MCP_SERVERS;

export type McpServerStatus = 'not-installed' | 'installed' | 'connected';

export function allServersConnected(statuses: Record<string, McpServerStatus>): boolean {
  return Object.values(statuses).every((s) => s === 'connected');
}

export function getAvailableMcpServers(): { name: string; url: string }[] {
  return Object.entries(MCP_SERVERS).map(([name, cfg]) => ({
    name,
    url: cfg.url,
  }));
}

export async function verifyMcpServer(serverName: McpServerName): Promise<boolean> {
  const server = MCP_SERVERS[serverName];
  try {
    await fetch(server.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...server.headers },
      body: '{}',
      signal: AbortSignal.timeout(5000),
    });
    return true;
  } catch {
    return false;
  }
}
