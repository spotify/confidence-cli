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
