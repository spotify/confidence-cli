import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readNpmDeps(dir: string): Set<string> {
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) return new Set();
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]);
  } catch {
    return new Set();
  }
}
