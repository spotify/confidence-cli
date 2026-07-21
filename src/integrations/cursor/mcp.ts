import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFile as execFileCb } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { McpConnectOpts } from '../types.js';
import {
  type McpServerName,
  type McpServerStatus,
  detectMcpStatuses as detectShared,
} from '../mcp/servers.js';
import { getRegisteredMcpNames, getStoredAuthToken } from '../mcp/config.js';
import { globalConfigPath, mcpConfigPath } from './paths.js';

const execFile = promisify(execFileCb);

export function detectMcpStatuses(
  projectDir: string,
): Promise<Record<McpServerName, McpServerStatus>> {
  const configPath = mcpConfigPath(projectDir);
  return detectShared({
    getRegisteredNames: () => getRegisteredMcpNames(configPath),
    getAuthToken: (name) => getStoredAuthToken(configPath, name),
  });
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
