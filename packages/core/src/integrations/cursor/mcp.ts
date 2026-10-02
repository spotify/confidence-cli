import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFile } from '../../exec/exec.js';
import type { McpConnectOpts, McpDisconnectOpts } from '../types.js';
import {
  type McpServerName,
  type McpServerStatus,
  detectMcpStatuses as detectShared,
} from '../mcp/servers.js';
import { getRegisteredMcpNames, getStoredAuthToken } from '../mcp/config.js';
import { cliConfigPath, globalConfigPath, mcpConfigPath } from './paths.js';

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
  writeCliPermission(cliConfigPath(opts.projectDir), opts.serverName);

  try {
    await execFile('cursor', ['agent', 'mcp', 'enable', opts.serverName]);
  } catch {
    // `cursor` CLI is not always installed; config files were already written above
  }
}

export async function disconnectMcpServer(opts: McpDisconnectOpts): Promise<void> {
  removeMcpEntry(mcpConfigPath(opts.projectDir), opts.serverName);
  removeCliPermission(cliConfigPath(opts.projectDir), opts.serverName);
}

function removeMcpEntry(configPath: string, serverName: string): void {
  if (!existsSync(configPath)) return;
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
    const mcpServers = (config.mcpServers ?? {}) as Record<string, unknown>;
    delete mcpServers[serverName];
    config.mcpServers = mcpServers;
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch {
    // Corrupt or unreadable config — server is effectively unregistered already
  }
}

function removeCliPermission(configPath: string, serverName: string): void {
  if (!existsSync(configPath)) return;
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
    const permissions = (config.permissions ?? {}) as Record<string, unknown>;
    const allow = (permissions.allow ?? []) as string[];
    const rule = `Mcp(${serverName}:*)`;
    permissions.allow = allow.filter((r) => r !== rule);
    config.permissions = permissions;
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch {
    // Corrupt or unreadable config — stale permission rules are harmless
  }
}

function writeMcpEntry(configPath: string, serverName: string, entry: unknown): void {
  let config: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
    } catch {
      // Corrupt JSON — fall through to overwrite with valid config
    }
  } else {
    mkdirSync(join(configPath, '..'), { recursive: true });
  }

  const mcpServers = (config.mcpServers ?? {}) as Record<string, unknown>;
  mcpServers[serverName] = entry;
  config.mcpServers = mcpServers;

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

function writeCliPermission(configPath: string, serverName: string): void {
  let config: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
    } catch {
      // Corrupt JSON — fall through to overwrite with valid config
    }
  } else {
    mkdirSync(join(configPath, '..'), { recursive: true });
  }

  const permissions = (config.permissions ?? {}) as Record<string, unknown>;
  const allow = (permissions.allow ?? []) as string[];
  const rule = `Mcp(${serverName}:*)`;

  if (!allow.includes(rule)) {
    allow.push(rule);
  }

  permissions.allow = allow;
  permissions.deny ??= [];
  config.permissions = permissions;

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}
