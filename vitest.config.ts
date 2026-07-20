import { defineConfig } from 'vitest/config';

const isCI = !!process.env.CI;

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
    include: ['__tests__/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['__tests__/msw/setup.ts'],
    clearMocks: true,
    maxWorkers: isCI ? 1 : 4,
    pool: 'forks',
    poolOptions: {
      forks: {
        execArgv: ['--import', './__tests__/msw/localstorage-fake.mjs'],
      },
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
