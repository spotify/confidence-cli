import type { PackageManager } from '@spotify-confidence/core';

type CliInstallStrategy = {
  kind: 'cli';
  buildCommand: (sdkPackage: string) => string;
};

type ManualInstallStrategy = {
  kind: 'manual';
  manifestFile: string;
};

export type InstallStrategy = CliInstallStrategy | ManualInstallStrategy;

const STRATEGIES: Record<PackageManager, InstallStrategy> = {
  npm: { kind: 'cli', buildCommand: (pkg) => `npm install ${pkg}` },
  pnpm: { kind: 'cli', buildCommand: (pkg) => `pnpm install ${pkg}` },
  yarn: { kind: 'cli', buildCommand: (pkg) => `yarn add ${pkg}` },
  bun: { kind: 'cli', buildCommand: (pkg) => `bun add ${pkg}` },
  pip: { kind: 'cli', buildCommand: (pkg) => `pip install ${pkg}` },
  go: { kind: 'cli', buildCommand: (pkg) => `go get ${pkg}` },
  swift: {
    kind: 'cli',
    buildCommand: (pkg) => `swift package add https://github.com/spotify/${pkg}`,
  },

  maven: { kind: 'manual', manifestFile: 'pom.xml' },
  gradle: { kind: 'manual', manifestFile: 'build.gradle' },
};

export function getInstallStrategy(pm: PackageManager): InstallStrategy {
  return STRATEGIES[pm];
}
