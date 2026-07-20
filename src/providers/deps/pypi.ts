import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readPypiDeps(dir: string): Set<string> {
  const deps = new Set<string>();

  const reqPath = join(dir, 'requirements.txt');
  if (existsSync(reqPath)) {
    try {
      const lines = readFileSync(reqPath, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const name = trimmed.split(/[=<>!~[\s;]/)[0].trim();
        if (name) deps.add(name.toLowerCase());
      }
    } catch {
      // ignore
    }
  }

  const pyprojectPath = join(dir, 'pyproject.toml');
  if (existsSync(pyprojectPath)) {
    try {
      const content = readFileSync(pyprojectPath, 'utf-8');
      const depsMatch = content.match(/\[project\][\s\S]*?dependencies\s*=\s*\[([\s\S]*?)\]/);
      if (depsMatch) {
        const entries = depsMatch[1].matchAll(/"([^"]+)"/g);
        for (const [, entry] of entries) {
          const name = entry.split(/[=<>!~[\s;]/)[0].trim();
          if (name) deps.add(name.toLowerCase());
        }
      }
    } catch {
      // ignore
    }
  }

  return deps;
}
