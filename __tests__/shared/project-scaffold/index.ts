import { mkdtempSync, rmSync } from 'node:fs';
import { SCAFFOLDS } from './scaffolds.js';
import type { ProjectType } from './types.js';

export type { ProjectType };

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
 * @param type - A named scaffold, or `null` for an empty directory.
 *   @defaultValue `'react'`
 * @returns An object with `path` and a disposer that removes the directory.
 *
 * @example
 * ```ts
 * using project = createProjectDir('react');
 * using project = createProjectDir('empty');
 * using project = createProjectDir('python-posthog');
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
