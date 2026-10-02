import type { FrameworkConfig } from '../types.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const goFramework: FrameworkConfig = {
  id: 'go',
  name: 'Go',
  docsUrl: 'https://confidence.spotify.com/docs/sdks/server/go',
  sdkPackage: 'github.com/spotify/confidence-resolver/openfeature-provider/go',
  detect: async (dir) => {
    return existsSync(join(dir, 'go.mod'));
  },
};
