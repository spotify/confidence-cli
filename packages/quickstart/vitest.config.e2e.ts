import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@commands': fileURLToPath(new URL('./src/commands', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/e2e/**/*.e2e.ts'],
    globalSetup: ['__tests__/e2e/global-setup.ts'],
    setupFiles: [],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    maxWorkers: 1,
    pool: 'forks',
    retry: {
      count: 2,
      condition: /timed out/i,
    },
  },
});
