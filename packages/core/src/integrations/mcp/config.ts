import { readFileSync } from 'node:fs';
import { MCP_SERVERS, type McpServerName } from './servers.js';

type McpJsonConfig = {
  mcpServers?: Record<string, { headers?: Record<string, string> }>;
};

function readMcpJsonConfig(configPath: string): McpJsonConfig | null {
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8')) as McpJsonConfig;
  } catch {
    return null;
  }
}

export function onlyKnownServerNames(names: string[]): McpServerName[] {
  const known = Object.keys(MCP_SERVERS) as McpServerName[];
  return known.filter((name) => names.includes(name));
}

export function getRegisteredMcpNames(configPath: string): McpServerName[] {
  const config = readMcpJsonConfig(configPath);
  if (!config) return [];

  return onlyKnownServerNames(Object.keys(config.mcpServers ?? {}));
}

export function getStoredAuthToken(configPath: string, serverName: McpServerName): string | null {
  const config = readMcpJsonConfig(configPath);
  const bearer = config?.mcpServers?.[serverName]?.headers?.['Authorization'];
  return bearer?.startsWith('Bearer ') ? bearer.slice(7) : null;
}
