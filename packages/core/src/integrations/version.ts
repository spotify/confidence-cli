const SEMVER_PATTERN = /(\d+\.\d+\.\d+)/;

export function extractVersion(raw: string): number[] | null {
  const match = SEMVER_PATTERN.exec(raw);
  if (!match) return null;
  return match[1].split('.').map(Number);
}

export function isAtLeast(current: number[], minimum: number[]): boolean {
  for (let i = 0; i < minimum.length; i++) {
    const c = current[i] ?? 0;
    const m = minimum[i] ?? 0;
    if (c > m) return true;
    if (c < m) return false;
  }
  return true;
}
