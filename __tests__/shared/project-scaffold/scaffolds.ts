import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { noop } from '@lib/noop.js';
import type { ProjectType } from './types.js';

function writeDeps(dir: string, dependencies: Record<string, string>): void {
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies }));
}

function writeDevDeps(dir: string, devDependencies: Record<string, string>): void {
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ devDependencies }));
}

function writeFile(dir: string, filename: string, content: string): void {
  writeFileSync(join(dir, filename), content);
}

export const SCAFFOLDS: Record<ProjectType, (dir: string) => void> = {
  empty: noop,

  react: (dir) => writeDeps(dir, { react: '^19.0.0' }),
  nextjs: (dir) => writeDeps(dir, { react: '^19.0.0', next: '^15.0.0' }),

  'react-eppo': (dir) => writeDeps(dir, { react: '^19.0.0', '@eppo/js-client-sdk': '^1.0.0' }),
  'react-statsig': (dir) => writeDeps(dir, { react: '^19.0.0', '@statsig/js-client': '^1.0.0' }),
  'react-posthog-statsig': (dir) =>
    writeDeps(dir, {
      react: '^19.0.0',
      'posthog-js': '^1.0.0',
      '@statsig/react-sdk': '^2.0.0',
    }),

  optimizely: (dir) => writeDeps(dir, { '@optimizely/optimizely-sdk': '^5.0.0' }),
  posthog: (dir) => writeDeps(dir, { 'posthog-js': '^1.0.0' }),
  statsig: (dir) => writeDeps(dir, { '@statsig/js-client': '^1.0.0' }),
  'statsig-node': (dir) => writeDevDeps(dir, { 'statsig-node': '^1.0.0' }),

  'python-posthog': (dir) => writeFile(dir, 'requirements.txt', 'posthog>=3.0.0\nflask==2.0.0\n'),
  'python-statsig': (dir) =>
    writeFile(
      dir,
      'pyproject.toml',
      `[project]\nname = "myapp"\ndependencies = [\n  "statsig>=1.0.0",\n  "flask"\n]\n`,
    ),
};
