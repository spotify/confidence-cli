import { join } from 'node:path';
import { homedir } from 'node:os';

export function globalMcpConfigPath(): string {
  return join(homedir(), '.gemini', 'config', 'mcp_config.json');
}

export function projectMcpConfigPath(projectDir: string): string {
  return join(projectDir, '.agents', 'mcp_config.json');
}

export function settingsPath(): string {
  return join(homedir(), '.gemini', 'antigravity-cli', 'settings.json');
}

export function skillsDir(projectDir: string): string {
  return join(projectDir, '.agents', 'skills');
}
