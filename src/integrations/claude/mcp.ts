import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { McpConnectOpts } from '../types.js';
import {
  type McpServerName,
  type McpServerStatus,
  detectMcpStatuses as detectShared,
} from '../mcp/servers.js';
import { getRegisteredMcpNames, getStoredAuthToken } from '../mcp/config.js';
import { projectConfigPath } from './paths.js';

const execFile = promisify(execFileCb);

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
    // Not registered yet — that's fine
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
      // overwrite
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
