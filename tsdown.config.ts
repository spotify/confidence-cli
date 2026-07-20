import { defineConfig } from 'tsdown';
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const STEPS_SRC = 'src/lib/onboarding-prompt/steps';
const STEPS_DIST = 'dist/bin/steps';

export default defineConfig({
  entry: ['bin/cli.ts'],
  outDir: 'dist/bin',
  format: 'esm',
  platform: 'node',
  target: 'node20',
  clean: true,
  dts: false,
  external: ['react', 'ink', '@inkjs/ui'],

  onSuccess() {
    mkdirSync(STEPS_DIST, { recursive: true });

    const steps = readdirSync(STEPS_SRC).filter((f) => f.endsWith('.md'));

    for (const file of steps) {
      copyFileSync(join(STEPS_SRC, file), join(STEPS_DIST, file));
    }
  },
});
