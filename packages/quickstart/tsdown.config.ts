import { defineConfig } from 'tsdown';
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const STEPS_SRC = 'src/features/onboarding/steps';
const STEPS_DIST = 'dist';

export default defineConfig({
  entry: ['bin/cli.ts', 'src/index.ts'],
  outDir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'node24',
  clean: true,
  dts: false,
  fixedExtension: false,
  deps: {
    alwaysBundle: ['@spotify-confidence/core', '@spotify-confidence/shared-kernel'],
    neverBundle: ['react', 'ink', '@inkjs/ui'],
  },

  onSuccess() {
    mkdirSync(STEPS_DIST, { recursive: true });

    const steps = readdirSync(STEPS_SRC).filter((f) => f.endsWith('.md'));

    for (const file of steps) {
      copyFileSync(join(STEPS_SRC, file), join(STEPS_DIST, file));
    }
  },
});
