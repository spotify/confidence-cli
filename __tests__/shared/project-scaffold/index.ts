import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { perPlatform } from '../platform.js';
import { SCAFFOLDS } from './scaffolds.js';
import type { ProjectType } from './types.js';

export type { ProjectType };

/**
 * Creates an isolated temporary directory populated with the requested
 * project scaffold. Supports `Symbol.dispose` for automatic cleanup.
 *
 * @remarks
 * Uses `/tmp/` on Unix instead of `os.tmpdir()`. On macOS `tmpdir()`
 * returns `/var/folders/…` which is longer than Linux's `/tmp/`, shifting
 * column alignment in the VT100 screen buffer and breaking e2e snapshot
 * assertions across platforms. On Windows, `/tmp/` doesn't exist so we
 * fall back to `os.tmpdir()`.
 *
 * @todo The Windows `tmpdir()` path is longer than `/tmp/`, producing
 * different VT100 column alignment and incompatible e2e snapshots. When
 * Windows CI is added, use a fixed-length prefix on all platforms.
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
  const prefix = perPlatform({
    windows: join(tmpdir(), 'wizard-test-'),
    unix: '/tmp/wizard-test-',
  });

  const dir = mkdtempSync(prefix);
  SCAFFOLDS[type](dir);

  return {
    path: dir,
    [Symbol.dispose]() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
