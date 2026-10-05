import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const isCI = !!process.env.CI;

export default defineConfig({
  resolve: {
    alias: {
      '@commands': fileURLToPath(new URL('./src/commands', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@input': fileURLToPath(new URL('./src/input', import.meta.url)),
      '@output': fileURLToPath(new URL('./src/output', import.meta.url)),
      '@network': fileURLToPath(new URL('./src/network', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@meta': fileURLToPath(new URL('./src/meta.ts', import.meta.url)),
      '@spotify-confidence/quickstart': fileURLToPath(
        new URL('../quickstart/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    clearMocks: true,
    maxWorkers: isCI ? 1 : 4,
    pool: 'forks',
    passWithNoTests: true,
    setupFiles: ['../testing/src/msw/setup.ts'],
    execArgv: ['--import', '../testing/src/msw/localstorage-fake.mjs'],
  },
});
