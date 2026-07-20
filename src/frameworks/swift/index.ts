import type { FrameworkConfig } from '../types.js';
import { existsSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export const swiftFramework: FrameworkConfig = {
  id: 'swift',
  name: 'Swift',
  docsUrl: 'https://confidence.spotify.com/docs/sdk/swift',
  sdkPackage: 'confidence-sdk-swift',
  detect: async (dir) => {
    if (existsSync(join(dir, 'Package.swift'))) return true;
    try {
      return readdirSync(dir).some((f) => f.endsWith('.xcodeproj') || f.endsWith('.xcworkspace'));
    } catch {
      return false;
    }
  },
};
