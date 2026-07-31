import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { noop } from '@lib/noop.js';

/**
 * Identifies a pre-built project scaffold.
 *
 * Each variant produces a minimal project directory that triggers a
 * specific code path in the wizard's framework-detection logic.
 *
 * - `'react'` — `package.json` with React 19 (auto-detects React framework)
 * - `'empty'` — bare directory (forces manual framework selection)
 * - `'react-statsig'` — React + Statsig SDK (triggers competitor detection)
 * - `'react-posthog-statsig'` — React + PostHog + Statsig (multi-competitor)
 */
type ProjectType = 'react' | 'empty' | 'react-statsig' | 'react-posthog-statsig';

function writeDeps(dir: string, dependencies: Record<string, string>): void {
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies }));
}

const SCAFFOLDS: Record<ProjectType, (dir: string) => void> = {
  empty: noop,
  react: (dir) => writeDeps(dir, { react: '^19.0.0' }),
  'react-statsig': (dir) => writeDeps(dir, { react: '^19.0.0', '@statsig/js-client': '^1.0.0' }),
  'react-posthog-statsig': (dir) =>
    writeDeps(dir, {
      react: '^19.0.0',
      'posthog-js': '^1.0.0',
      '@statsig/js-client': '^1.0.0',
    }),
};

/**
 * Creates an isolated temporary directory populated with the requested
 * project scaffold. Supports `Symbol.dispose` for automatic cleanup.
 *
 * @remarks
 * Uses a hardcoded `/tmp/` prefix instead of `os.tmpdir()`. On macOS
 * `tmpdir()` returns `/var/folders/…` which is longer than Linux's `/tmp/`,
 * shifting column alignment in the VT100 screen buffer and breaking e2e
 * snapshot assertions across platforms.
 *
 * @param type - Which scaffold to use. @defaultValue `'react'`
 * @returns An object with `path` and a disposer that removes the directory.
 *
 * @example
 * ```ts
 * using project = createProjectDir('react');
 * // project.path contains package.json with { dependencies: { react: '^19.0.0' } }
 *
 * using project = createProjectDir('empty');
 * // project.path is an empty temporary directory
 * ```
 */
export function createProjectDir(type: ProjectType = 'react') {
  const dir = mkdtempSync('/tmp/wizard-test-');
  SCAFFOLDS[type](dir);

  return {
    path: dir,
    [Symbol.dispose]() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export type { ProjectType };
