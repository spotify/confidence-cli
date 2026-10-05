import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsdown';

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string };

export default defineConfig({
  entry: ['bin/cli.ts'],
  outDir: 'dist/bin',
  format: 'esm',
  platform: 'node',
  target: 'node24',
  clean: true,
  dts: false,
  fixedExtension: false,
  define: {
    __CLI_VERSION__: JSON.stringify(version),
  },
  deps: {
    alwaysBundle: ['@spotify-confidence/core', '@spotify-confidence/shared-kernel'],
    neverBundle: ['@spotify-confidence/quickstart'],
  },
});
