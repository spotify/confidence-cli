import type { FrameworkConfig } from '../types.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const pythonFramework: FrameworkConfig = {
  id: 'python',
  name: 'Python',
  docsUrl: 'https://confidence.spotify.com/docs/sdk/python',
  sdkPackage: 'spotify-confidence-sdk',
  detect: async (dir) => {
    return (
      existsSync(join(dir, 'requirements.txt')) ||
      existsSync(join(dir, 'pyproject.toml')) ||
      existsSync(join(dir, 'setup.py')) ||
      existsSync(join(dir, 'Pipfile'))
    );
  },
};
