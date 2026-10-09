import { join } from 'node:path';
import { homedir } from 'node:os';

export function globalConfigPath(): string {
  return join(homedir(), '.cursor', 'mcp.json');
}

export function cliConfigPath(projectDir: string): string {
  return join(projectDir, '.cursor', 'cli.json');
}
