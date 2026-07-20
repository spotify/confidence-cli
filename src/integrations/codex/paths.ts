import { join } from 'node:path';
import { homedir } from 'node:os';

export function globalConfigPath(): string {
  return join(homedir(), '.codex', 'config.toml');
}

export function projectConfigPath(projectDir: string): string {
  return join(projectDir, '.codex', 'config.toml');
}

export function skillsDir(projectDir: string): string {
  return join(projectDir, '.agents', 'skills');
}
