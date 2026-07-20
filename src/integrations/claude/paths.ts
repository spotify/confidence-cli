import { join } from 'node:path';
import { homedir } from 'node:os';

export function globalConfigPath(): string {
  return join(homedir(), '.claude.json');
}

export function projectConfigPath(projectDir: string): string {
  return join(projectDir, '.mcp.json');
}

export function mcpConfigPath(projectDir: string): string {
  return join(projectDir, '.claude', 'settings.local.json');
}

export function skillsDir(projectDir: string): string {
  return join(projectDir, '.claude', 'skills');
}
