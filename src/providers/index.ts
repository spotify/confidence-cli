import type { ProviderConfig, DetectedProvider } from './types.js';
import { readNpmDeps, readPypiDeps, readGoModDeps } from './deps/index.js';
import { eppoProvider } from './eppo/index.js';
import { optimizelyProvider } from './optimizely/index.js';
import { posthogProvider } from './posthog/index.js';
import { statsigProvider } from './statsig/index.js';

export type { ProviderConfig, DetectedProvider } from './types.js';

const PROVIDERS: ProviderConfig[] = [
  eppoProvider,
  optimizelyProvider,
  posthogProvider,
  statsigProvider,
];

export function getProviders(): ProviderConfig[] {
  return PROVIDERS;
}

export function detectProviders(dir: string): DetectedProvider[] {
  const npmDeps = readNpmDeps(dir);
  const pypiDeps = readPypiDeps(dir);
  const gomodDeps = readGoModDeps(dir);

  const detected: DetectedProvider[] = [];

  for (const provider of PROVIDERS) {
    const found =
      provider.packages.npm?.some((pkg) => npmDeps.has(pkg)) ||
      provider.packages.pypi?.some((pkg) => pypiDeps.has(pkg)) ||
      provider.packages.gomod?.some((pkg) => gomodDeps.has(pkg));

    if (found) {
      detected.push({ id: provider.id, name: provider.name, skillName: provider.skillName });
    }
  }

  return detected;
}
