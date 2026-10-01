import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readGoModDeps(dir: string): Set<string> {
  const goModPath = join(dir, 'go.mod');
  if (!existsSync(goModPath)) return new Set();
  try {
    const content = readFileSync(goModPath, 'utf-8');
    const deps = new Set<string>();
    const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/);
    if (requireBlock) {
      const lines = requireBlock[1].split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//')) continue;
        const mod = trimmed.split(/\s/)[0];
        if (mod) deps.add(mod);
      }
    }
    const singleRequires = content.matchAll(/^require\s+(\S+)/gm);
    for (const [, mod] of singleRequires) {
      deps.add(mod);
    }
    return deps;
  } catch {
    return new Set();
  }
}
