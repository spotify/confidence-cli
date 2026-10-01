import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const isCI = !!process.env.CI;

export default defineConfig({
  resolve: {
    alias: {
      '@commands': fileURLToPath(new URL('./src/commands', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['../testing/src/msw/setup.ts'],
    clearMocks: true,
    maxWorkers: isCI ? 1 : 4,
    pool: 'forks',
    execArgv: ['--import', '../testing/src/msw/localstorage-fake.mjs'],
  },
  esbuild: {
    jsx: 'automatic',
  },
});
