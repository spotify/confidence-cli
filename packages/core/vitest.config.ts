import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const isCI = !!process.env.CI;

export default defineConfig({
  resolve: {
    alias: {
      '@auth': fileURLToPath(new URL('./src/auth', import.meta.url)),
      '@telemetry': fileURLToPath(new URL('./src/telemetry', import.meta.url)),
      '@exec': fileURLToPath(new URL('./src/exec', import.meta.url)),
      '@system': fileURLToPath(new URL('./src/system', import.meta.url)),
      '@sdk': fileURLToPath(new URL('./src/sdk', import.meta.url)),
      '@frameworks': fileURLToPath(new URL('./src/frameworks', import.meta.url)),
      '@integrations': fileURLToPath(new URL('./src/integrations', import.meta.url)),
      '@providers': fileURLToPath(new URL('./src/providers', import.meta.url)),
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
  },
});
