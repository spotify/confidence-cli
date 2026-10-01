import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function findPackageJson(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (true) {
    const candidate = join(dir, 'package.json');
    try {
      const pkg = JSON.parse(readFileSync(candidate, 'utf-8')) as { name?: string };
      if (pkg.name === '@spotify-confidence/quickstart') return candidate;
    } catch {
      // Not this directory — keep walking up.
    }
    const parent = dirname(dir);
    if (parent === dir) throw new Error('Could not find quickstart package.json');
    dir = parent;
  }
}

const pkg = JSON.parse(readFileSync(findPackageJson(), 'utf-8')) as {
  name: string;
  version: string;
};

export const APP_NAME = pkg.name;
export const APP_VERSION = pkg.version;
