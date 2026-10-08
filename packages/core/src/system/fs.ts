import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

export function isDirectoryEmpty(dir: string): boolean {
  try {
    const entries = readdirSync(dir);
    const meaningful = entries.filter((e) => !e.startsWith('.'));
    return meaningful.length === 0;
  } catch {
    return false;
  }
}

export function resolveGitRoot(dir: string): string | null {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: dir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}
