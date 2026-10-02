import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type ClaudeSettings = {
  permissions?: { allow?: string[] };
  enabledMcpjsonServers?: string[];
};

type CursorMcpConfig = {
  mcpServers?: Record<string, unknown>;
};

type CursorCliConfig = {
  permissions?: { allow?: string[]; deny?: string[] };
};

export function writeClaudeSettings(projectDir: string, settings: ClaudeSettings): void {
  const dir = join(projectDir, '.claude');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'settings.local.json'), JSON.stringify(settings, null, 2));
}

export function writeCursorMcpConfig(projectDir: string, config: CursorMcpConfig): void {
  const dir = join(projectDir, '.cursor');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'mcp.json'), JSON.stringify(config, null, 2));
}

export function writeCursorCliConfig(projectDir: string, config: CursorCliConfig): void {
  const dir = join(projectDir, '.cursor');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'cli.json'), JSON.stringify(config, null, 2));
}

export function writeCodexConfig(projectDir: string, content: string): void {
  const dir = join(projectDir, '.codex');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'config.toml'), content);
}
