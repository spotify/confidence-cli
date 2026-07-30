import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { McpConnectOpts } from '../types.js';
import {
  type McpServerName,
  type McpServerStatus,
  detectMcpStatuses as detectShared,
} from '../mcp/servers.js';
import { getRegisteredMcpNames, getStoredAuthToken } from '../mcp/config.js';
import { globalMcpConfigPath, projectMcpConfigPath, settingsPath } from './paths.js';

export function detectMcpStatuses(
  projectDir: string,
): Promise<Record<McpServerName, McpServerStatus>> {
  return detectShared({
    getRegisteredNames: () => {
      const global = getRegisteredMcpNames(globalMcpConfigPath());
      const project = getRegisteredMcpNames(projectMcpConfigPath(projectDir));
      return [...new Set([...global, ...project])];
    },
    getAuthToken: (name) =>
      getStoredAuthToken(globalMcpConfigPath(), name) ??
      getStoredAuthToken(projectMcpConfigPath(projectDir), name),
  });
}

export async function connectMcpServer(opts: McpConnectOpts): Promise<void> {
  const headers: Record<string, string> = { ...opts.serverHeaders };
  if (opts.accessToken) {
    headers['Authorization'] = `Bearer ${opts.accessToken}`;
  }

  const entry = { serverUrl: opts.serverUrl, headers };

  writeMcpEntry(projectMcpConfigPath(opts.projectDir), opts.serverName, entry);
  writeMcpEntry(globalMcpConfigPath(), opts.serverName, entry);
  writeMcpPermission(settingsPath(), opts.serverName);
}

function writeMcpEntry(configPath: string, serverName: string, entry: unknown): void {
  let config: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
    } catch {
      // overwrite if corrupt
    }
  } else {
    mkdirSync(join(configPath, '..'), { recursive: true });
  }

  const mcpServers = (config.mcpServers ?? {}) as Record<string, unknown>;
  mcpServers[serverName] = entry;
  config.mcpServers = mcpServers;

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

function writeMcpPermission(path: string, serverName: string): void {
  let settings: Record<string, unknown> = {};
  if (existsSync(path)) {
    try {
      settings = JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
    } catch {
      // overwrite if corrupt
    }
  } else {
    mkdirSync(join(path, '..'), { recursive: true });
  }

  const permissions = (settings.permissions ?? {}) as Record<string, unknown>;
  const allow = (permissions.allow ?? []) as string[];
  const rule = `mcp(${serverName}/*)`;

  if (!allow.includes(rule)) {
    allow.push(rule);
  }

  permissions.allow = allow;
  settings.permissions = permissions;

  writeFileSync(path, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
}
