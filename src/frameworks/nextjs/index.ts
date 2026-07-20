import type { FrameworkConfig } from '../types.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const nextjsFramework: FrameworkConfig = {
  id: 'nextjs',
  name: 'Next.js',
  docsUrl: 'https://confidence.spotify.com/docs/sdk/nextjs',
  sdkPackage: '@spotify-confidence/sdk',
  detect: async (dir) => {
    const pkgPath = join(dir, 'package.json');
    if (!existsSync(pkgPath)) return false;
    const { default: pkg } = await import(pkgPath, { with: { type: 'json' } });
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return 'next' in deps;
  },
};
