import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { noop } from '@lib/noop.js';

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

export function createProjectDir(type: ProjectType = 'react') {
  const dir = mkdtempSync(join(tmpdir(), 'wizard-test-'));
  SCAFFOLDS[type](dir);

  return {
    path: dir,
    [Symbol.dispose]() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export type { ProjectType };
