import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Identifies a pre-built project scaffold.
 *
 * Each variant produces a minimal project directory that triggers a
 * specific code path in the wizard's framework-detection logic.
 *
 * - `'react'` — contains a `package.json` with a React 19 dependency
 *   so the wizard auto-detects the React framework.
 * - `'empty'` — bare directory with no files, forcing the wizard to
 *   prompt the user for framework selection.
 */
type ProjectType = 'react' | 'empty';

const SCAFFOLDS: Record<ProjectType, (dir: string) => void> = {
  react(dir) {
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ dependencies: { react: '^19.0.0' } }),
    );
  },
  empty() {},
};

/**
 * Creates an isolated temporary directory populated with the requested
 * project scaffold.
 *
 * @param type - Which scaffold to use.
 * @returns Absolute path to the created project directory.
 *
 * @example
 * ```ts
 * const dir = createProjectDir('react');
 * // dir contains package.json with { dependencies: { react: '^19.0.0' } }
 *
 * const dir = createProjectDir('empty');
 * // dir is an empty temporary directory
 * ```
 */
export function createProjectDir(type: ProjectType): string {
  const dir = mkdtempSync('/tmp/e2e-project-');
  SCAFFOLDS[type](dir);
  return dir;
}

export type { ProjectType };
