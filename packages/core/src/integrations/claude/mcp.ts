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
import { projectConfigPath } from './paths.js';

export function detectMcpStatuses(
  projectDir: string,
): Promise<Record<McpServerName, McpServerStatus>> {
  const configPath = projectConfigPath(projectDir);
  return detectShared({
    getRegisteredNames: () => getRegisteredMcpNames(configPath),
    getAuthToken: (name) => getStoredAuthToken(configPath, name),
  });
}

export async function connectMcpServer(opts: McpConnectOpts): Promise<void> {
  try {
    await execFile('claude', ['mcp', 'remove', '--scope', 'project', opts.serverName], {
      cwd: opts.projectDir,
    });
  } catch {
    // Server may not be registered yet; the subsequent `mcp add` is idempotent
  }

  const headers: Record<string, string> = { ...opts.serverHeaders };
  if (opts.accessToken) {
    headers['Authorization'] = `Bearer ${opts.accessToken}`;
  }

  const args = [
    'mcp',
    'add',
    '--transport',
    'http',
    '--scope',
    'project',
    opts.serverName,
    opts.serverUrl,
  ];
  for (const [key, value] of Object.entries(headers)) {
    args.push('--header', `${key}: ${value}`);
  }

  await execFile('claude', args, { cwd: opts.projectDir });

  allowMcpToolsInSettings(opts.serverName, opts.projectDir);
}

export async function disconnectMcpServer(opts: McpDisconnectOpts): Promise<void> {
  await execFile('claude', ['mcp', 'remove', '--scope', 'project', opts.serverName], {
    cwd: opts.projectDir,
  });

  removeMcpToolsFromSettings(opts.serverName, opts.projectDir);
}

function removeMcpToolsFromSettings(serverName: string, projectDir: string): void {
  const settingsPath = join(projectDir, '.claude', 'settings.local.json');
  if (!existsSync(settingsPath)) return;

  let settings: ClaudeSettings;
  try {
    settings = JSON.parse(readFileSync(settingsPath, 'utf-8')) as ClaudeSettings;
  } catch {
    return;
  }

  const toolPattern = `mcp__${serverName}__*`;
  if (settings.permissions?.allow) {
    settings.permissions.allow = settings.permissions.allow.filter((p) => p !== toolPattern);
  }

  if (settings.enabledMcpjsonServers) {
    settings.enabledMcpjsonServers = settings.enabledMcpjsonServers.filter((s) => s !== serverName);
  }

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
}

type ClaudeSettings = {
  permissions?: {
    allow?: string[];
    [key: string]: unknown;
  };
  enabledMcpjsonServers?: string[];
  [key: string]: unknown;
};

function allowMcpToolsInSettings(serverName: string, projectDir: string): void {
  const settingsDir = join(projectDir, '.claude');
  const settingsPath = join(settingsDir, 'settings.local.json');

  if (!existsSync(settingsDir)) {
    mkdirSync(settingsDir, { recursive: true });
  }

  let settings: ClaudeSettings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8')) as ClaudeSettings;
    } catch {
      // Corrupt JSON — fall through to overwrite with valid settings
    }
  }

  const permissions = settings.permissions ?? {};
  const allow = permissions.allow ?? [];
  const toolPattern = `mcp__${serverName}__*`;
  if (!allow.includes(toolPattern)) {
    allow.push(toolPattern);
  }
  settings.permissions = { ...permissions, allow };

  const enabled = settings.enabledMcpjsonServers ?? [];
  if (!enabled.includes(serverName)) {
    enabled.push(serverName);
  }
  settings.enabledMcpjsonServers = enabled;

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
}
