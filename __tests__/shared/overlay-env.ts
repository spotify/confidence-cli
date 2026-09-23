/**
 * Merges environment layers, replacing keys that differ only by case.
 *
 * Spreading `process.env` on Windows leaves `Path` / `Temp` alongside later
 * `PATH` / `TEMP` entries. Child processes can then keep the host values.
 */
export function overlayEnv(
  ...layers: Array<NodeJS.Dict<string | undefined>>
): Record<string, string> {
  const result: Record<string, string> = {};
  const keyByLower = new Map<string, string>();

  for (const layer of layers) {
    for (const [key, value] of Object.entries(layer)) {
      if (value === undefined) continue;

      const lower = key.toLowerCase();
      const previousKey = keyByLower.get(lower);
      if (previousKey !== undefined && previousKey !== key) {
        delete result[previousKey];
      }

      result[key] = value;
      keyByLower.set(lower, key);
    }
  }

  return result;
}
