import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFile as execFileCb } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { McpConnectOpts } from '../types.js';
import {
  MCP_SERVERS,
  type McpServerName,
  type McpServerStatus,
  verifyMcpServer,
} from '../mcp/servers.js';
import { globalConfigPath, mcpConfigPath } from './paths.js';

const execFile = promisify(execFileCb);

export async function detectMcpStatuses(
  projectDir: string,
): Promise<Record<McpServerName, McpServerStatus>> {
  const registered = getRegisteredMcpNames(projectDir);
  const names = Object.keys(MCP_SERVERS) as McpServerName[];

  const statuses = await Promise.all(
    names.map(async (name): Promise<[McpServerName, McpServerStatus]> => {
      if (!registered.includes(name)) return [name, 'not-installed'];
      const ok = await verifyMcpServer(name);
      return [name, ok ? 'connected' : 'installed'];
    }),
  );

  return Object.fromEntries(statuses) as Record<McpServerName, McpServerStatus>;
}

export async function connectMcpServer(opts: McpConnectOpts): Promise<void> {
  const headers: Record<string, string> = { ...opts.serverHeaders };
  if (opts.accessToken) {
    headers['Authorization'] = `Bearer ${opts.accessToken}`;
  }

  const entry = { type: opts.serverType, url: opts.serverUrl, headers };

  writeMcpEntry(mcpConfigPath(opts.projectDir), opts.serverName, entry);
  writeMcpEntry(globalConfigPath(), opts.serverName, entry);

  try {
    await execFile('cursor', ['agent', 'mcp', 'enable', opts.serverName]);
  } catch {
    // cursor agent CLI may not be available
  }
}

export function refreshMcpAuth(opts: import('../types.js').McpRefreshOpts): void {
  const headers: Record<string, string> = {
    ...opts.serverHeaders,
    Authorization: `Bearer ${opts.accessToken}`,
  };
  const entry = { type: opts.serverType, url: opts.serverUrl, headers };
  writeMcpEntry(mcpConfigPath(opts.projectDir), opts.serverName, entry);
  writeMcpEntry(globalConfigPath(), opts.serverName, entry);
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

function getRegisteredMcpNames(projectDir: string): string[] {
  try {
    const config = JSON.parse(readFileSync(mcpConfigPath(projectDir), 'utf-8')) as Record<
      string,
      unknown
    >;
    const mcpServers = (config.mcpServers ?? {}) as Record<string, unknown>;
    return (Object.keys(MCP_SERVERS) as McpServerName[]).filter((name) => name in mcpServers);
  } catch {
    return [];
  }
}
