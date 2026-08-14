import type { DetectedProvider } from '@providers/types.js';

export function formatProviderNames(providers: DetectedProvider[]): string {
  const names = providers.map((p) => p.name);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}
