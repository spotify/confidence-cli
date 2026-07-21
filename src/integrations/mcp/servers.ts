import { validateToken } from '@lib/auth.js';

const MCP_BASE_URL = process.env.CONFIDENCE_MCP_URL ?? 'https://mcp.confidence.dev';

export const MCP_SERVERS = {
  'confidence-flags': {
    type: 'http' as const,
    url: `${MCP_BASE_URL}/mcp/flags`,
    headers: { 'x-confidence-mcp-consumer': 'plugin' },
  },
  'confidence-docs': {
    type: 'http' as const,
    url: `${MCP_BASE_URL}/mcp/docs`,
    headers: { 'x-confidence-mcp-consumer': 'plugin' },
  },
};

export type McpServerName = keyof typeof MCP_SERVERS;
export type McpServer = {
  name: McpServerName;
  url: string;
};

export type McpServerStatus = 'not-installed' | 'installed' | 'auth-expired' | 'connected';

export function allServersConnected(statuses: Record<string, McpServerStatus>): boolean {
  return Object.values(statuses).every((s) => s === 'connected');
}

export function getAvailableMcpServers(): McpServer[] {
  return Object.entries(MCP_SERVERS).map(([name, cfg]) => ({ name, url: cfg.url }) as McpServer);
}

export async function detectMcpStatuses(deps: {
  getRegisteredNames: () => string[];
  getAuthToken: (name: McpServerName) => string | null;
}): Promise<Record<McpServerName, McpServerStatus>> {
  const registered = deps.getRegisteredNames();
  const names = Object.keys(MCP_SERVERS) as McpServerName[];

  const statuses = await Promise.all(
    names.map(async (name): Promise<[McpServerName, McpServerStatus]> => {
      if (!registered.includes(name)) {
        return [name, 'not-installed'];
      }

      const authToken = deps.getAuthToken(name);
      const status = await verifyMcpServer(name, { authToken });
      return [name, status];
    }),
  );

  return Object.fromEntries(statuses) as Record<McpServerName, McpServerStatus>;
}

export type McpVerifyOpts = {
  authToken?: string | null;
};

export async function verifyMcpServer(
  serverName: McpServerName,
  opts?: McpVerifyOpts,
): Promise<McpServerStatus> {
  if (opts?.authToken) {
    const { valid } = validateToken(opts.authToken);
    if (!valid) return 'auth-expired';
  }

  const server = MCP_SERVERS[serverName];
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...server.headers,
  };

  if (opts?.authToken) {
    headers['Authorization'] = `Bearer ${opts.authToken}`;
  }

  try {
    const { status } = await fetch(server.url, {
      method: 'POST',
      headers,
      body: '{}',
      signal: AbortSignal.timeout(5000),
    });

    return status === 401 || status === 403 ? 'auth-expired' : 'connected';
  } catch {
    return 'installed';
  }
}
