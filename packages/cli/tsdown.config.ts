import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['bin/cli.ts'],
  outDir: 'dist/bin',
  format: 'esm',
  platform: 'node',
  target: 'node24',
  clean: true,
  dts: false,
  fixedExtension: false,
  deps: {
    alwaysBundle: ['@spotify-confidence/core', '@spotify-confidence/shared-kernel'],
  },
});
