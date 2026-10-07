import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { McpConnectOpts, McpDisconnectOpts } from '../../types.js';

type ClaudePermissions = {
  allow?: string[];
  [key: string]: unknown;
};

type ClaudeSettings = {
  permissions?: ClaudePermissions;
  [key: string]: unknown;
};

export function allowMcpToolsInSettings(opts: McpConnectOpts): void {
  const settingsPath = settingsFilePath(opts.projectDir);
  const settings = readOrCreateSettings(settingsPath);

  const permissions = settings.permissions ?? {};
  const allow = permissions.allow ?? [];
  const toolPattern = `mcp__${opts.serverName}__*`;

  if (!allow.includes(toolPattern)) {
    allow.push(toolPattern);
  }

  settings.permissions = { ...permissions, allow };

  writeSettings(settingsPath, settings);
}

export function removeMcpToolsFromSettings(opts: McpDisconnectOpts): void {
  const settingsPath = settingsFilePath(opts.projectDir);
  const settings = readSettings(settingsPath);
  if (!settings) return;

  const toolPattern = `mcp__${opts.serverName}__*`;
  if (settings.permissions?.allow) {
    settings.permissions.allow = settings.permissions.allow.filter((p) => p !== toolPattern);
  }

  writeSettings(settingsPath, settings);
}

function settingsFilePath(projectDir: string): string {
  return join(projectDir, '.claude', 'settings.local.json');
}

function readSettings(settingsPath: string): ClaudeSettings | null {
  if (!existsSync(settingsPath)) return null;
  try {
    return JSON.parse(readFileSync(settingsPath, 'utf-8')) as ClaudeSettings;
  } catch {
    return null;
  }
}

function readOrCreateSettings(settingsPath: string): ClaudeSettings {
  const existing = readSettings(settingsPath);
  if (existing) return existing;

  const settingsDir = join(settingsPath, '..');
  if (!existsSync(settingsDir)) {
    mkdirSync(settingsDir, { recursive: true });
  }

  return {};
}

function writeSettings(settingsPath: string, settings: ClaudeSettings): void {
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
}
