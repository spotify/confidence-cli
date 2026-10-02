import type { FrameworkConfig } from '../types.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const javaFramework: FrameworkConfig = {
  id: 'java',
  name: 'Java',
  docsUrl: 'https://confidence.spotify.com/docs/sdks/server/java',
  sdkPackage: 'com.spotify.confidence:openfeature-provider-local',
  detect: async (dir) => {
    if (existsSync(join(dir, 'pom.xml'))) return true;
    const hasGradle =
      existsSync(join(dir, 'build.gradle')) || existsSync(join(dir, 'build.gradle.kts'));
    if (!hasGradle) return false;
    return !existsSync(join(dir, 'app', 'src', 'main', 'AndroidManifest.xml'));
  },
};
