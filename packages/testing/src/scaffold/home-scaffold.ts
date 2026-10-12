import { vi } from 'vitest';

/**
 * Stubs the `HOME` environment variable to `dir`, isolating the test
 * from real user config files (`~/.cursor/`, `~/.claude.json`, etc.).
 * Supports `Symbol.dispose` for automatic cleanup via `vi.unstubAllEnvs`.
 *
 * @example
 * ```ts
 * using project = createProjectDir();
 * using _home = isolateHome(project.path);
 * ```
 */
export function isolateHome(dir: string) {
  vi.stubEnv('HOME', dir);

  return {
    [Symbol.dispose]() {
      vi.unstubAllEnvs();
    },
  };
}
