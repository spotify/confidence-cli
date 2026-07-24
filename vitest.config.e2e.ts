import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@commands': new URL('./src/commands', import.meta.url).pathname,
      '@frameworks': new URL('./src/frameworks', import.meta.url).pathname,
      '@integrations': new URL('./src/integrations', import.meta.url).pathname,
      '@providers': new URL('./src/providers', import.meta.url).pathname,
      '@ui': new URL('./src/ui', import.meta.url).pathname,
      '@lib': new URL('./src/lib', import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/e2e/**/*.e2e.ts'],
    globalSetup: ['__tests__/e2e/global-setup.ts'],
    setupFiles: [],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    maxWorkers: 1,
    pool: 'forks',
    retry: {
      count: 2,
      condition: /timed out/i,
    },
  },
});
