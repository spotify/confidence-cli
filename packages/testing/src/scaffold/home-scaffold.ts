import { vi } from 'vitest';

/**
 * Stubs `HOME` and `USERPROFILE` environment variables to `dir`, isolating the test
 * from real user config files (`~/.cursor/`, `~/.claude.json`, etc.) across platforms.
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
  vi.stubEnv('USERPROFILE', dir);

  return {
    [Symbol.dispose]() {
      vi.unstubAllEnvs();
    },
  };
}
