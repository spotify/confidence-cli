import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { InstallCommand } from './install-types.js';

type PythonPM = 'poetry' | 'uv' | 'pipenv' | 'pip';

function detectPythonPM(dir: string): PythonPM {
  if (existsSync(join(dir, 'poetry.lock'))) return 'poetry';
  if (existsSync(join(dir, 'uv.lock'))) return 'uv';
  if (existsSync(join(dir, 'Pipfile')) || existsSync(join(dir, 'Pipfile.lock'))) return 'pipenv';
  return 'pip';
}

export function buildPythonInstall(pkg: string, dir: string): InstallCommand {
  const pm = detectPythonPM(dir);
  switch (pm) {
    case 'poetry':
      return { type: 'auto', cmd: 'poetry', args: ['add', pkg] };
    case 'uv':
      return { type: 'auto', cmd: 'uv', args: ['add', pkg] };
    case 'pipenv':
      return { type: 'auto', cmd: 'pipenv', args: ['install', pkg] };
    case 'pip':
      return {
        type: 'manual',
        snippet: `Add ${pkg} to your project dependencies and install it:\n\n  pip install ${pkg}`,
      };
    default: {
      const _exhaustive: never = pm;
      throw new Error(`Unknown Python PM: ${_exhaustive}`);
    }
  }
}
