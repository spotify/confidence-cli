import type { FrameworkConfig } from '../types.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const kotlinFramework: FrameworkConfig = {
  id: 'kotlin',
  name: 'Android (Kotlin)',
  docsUrl: 'https://confidence.spotify.com/docs/sdk/android',
  sdkPackage: 'com.spotify.confidence:openfeature-provider-android',
  detect: async (dir) => {
    const hasGradle =
      existsSync(join(dir, 'build.gradle')) || existsSync(join(dir, 'build.gradle.kts'));
    if (!hasGradle) return false;
    return existsSync(join(dir, 'app', 'src', 'main', 'AndroidManifest.xml'));
  },
};
