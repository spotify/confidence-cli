import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { InstallCommand } from './install-types.js';

type NodePM = 'npm' | 'pnpm' | 'yarn' | 'bun';

function detectNodePM(dir: string): NodePM {
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(dir, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock'))) return 'bun';
  return 'npm';
}

function hasPackageJsonWorkspaces(dir: string): boolean {
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) return false;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return Array.isArray(pkg.workspaces) || typeof pkg.workspaces === 'object';
  } catch {
    return false;
  }
}

function workspaceRootArgs(pm: NodePM, dir: string): string[] {
  if (pm === 'pnpm' && existsSync(join(dir, 'pnpm-workspace.yaml'))) return ['-w'];
  if (pm === 'yarn' && hasPackageJsonWorkspaces(dir) && !existsSync(join(dir, '.yarnrc.yml'))) {
    return ['-W'];
  }

  return [];
}

export function buildNodeInstall(pkg: string, dir: string): InstallCommand {
  const pm = detectNodePM(dir);
  return { type: 'auto', cmd: pm, args: ['add', ...workspaceRootArgs(pm, dir), pkg] };
}
