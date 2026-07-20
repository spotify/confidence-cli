import type { FrameworkConfig } from '../types.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const nodeFramework: FrameworkConfig = {
  id: 'node',
  name: 'Node.js',
  docsUrl: 'https://confidence.spotify.com/docs/sdk/node',
  sdkPackage: '@spotify-confidence/server-sdk',
  detect: async (dir) => {
    const pkgPath = join(dir, 'package.json');
    return existsSync(pkgPath);
  },
};
