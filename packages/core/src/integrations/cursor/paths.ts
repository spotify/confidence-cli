import { join } from 'node:path';
import { homedir } from 'node:os';

export function globalConfigPath(): string {
  return join(homedir(), '.cursor', 'mcp.json');
}

export function projectConfigPath(projectDir: string): string {
  return join(projectDir, '.cursor', 'mcp.json');
}

export function mcpConfigPath(projectDir: string): string {
  return join(projectDir, '.cursor', 'mcp.json');
}

export function cliConfigPath(projectDir: string): string {
  return join(projectDir, '.cursor', 'cli.json');
}

export function skillsDir(projectDir: string): string {
  return join(projectDir, '.cursor', 'skills');
}
