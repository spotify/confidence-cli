import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type PackageManager =
  'npm' | 'pnpm' | 'yarn' | 'bun' | 'pip' | 'go' | 'swift' | 'gradle' | 'maven';

const JS_PACKAGE_MANAGERS: PackageManager[] = ['pnpm', 'yarn', 'npm', 'bun'] as const;

const LOCKFILE_TO_PM: [string, PackageManager][] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lockb', 'bun'],
  ['bun.lock', 'bun'],
  ['package-lock.json', 'npm'],
  ['go.mod', 'go'],
  ['Package.swift', 'swift'],
  ['pom.xml', 'maven'],
  ['build.gradle', 'gradle'],
  ['build.gradle.kts', 'gradle'],
  ['requirements.txt', 'pip'],
  ['pyproject.toml', 'pip'],
  ['Pipfile', 'pip'],

  // Polyglot projects (e.g. Go + JS tooling)
  // should match the primary ecosystem first,
  // hence `package.json` at the end:
  ['package.json', 'npm'],
];

export function detectPackageManager(projectDir: string): PackageManager | null {
  const fromManifest = readPackageManagerField(projectDir);
  if (fromManifest) return fromManifest;

  for (const [file, pm] of LOCKFILE_TO_PM) {
    if (existsSync(join(projectDir, file))) return pm;
  }

  return null;
}

function readPackageManagerField(projectDir: string): PackageManager | null {
  const pkgPath = join(projectDir, 'package.json');
  if (!existsSync(pkgPath)) return null;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const field = pkg.packageManager as string | undefined;
    if (!field) return null;

    const name = field.split('@')[0] as PackageManager;
    return JS_PACKAGE_MANAGERS.includes(name) ? name : null;
  } catch {
    return null;
  }
}
