import type { FrameworkConfig } from '../types.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const goFramework: FrameworkConfig = {
  id: 'go',
  name: 'Go',
  docsUrl: 'https://confidence.spotify.com/docs/sdk/go',
  sdkPackage: 'github.com/spotify/confidence-sdk-go',
  detect: async (dir) => {
    return existsSync(join(dir, 'go.mod'));
  },
};
