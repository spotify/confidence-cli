import type { JsonObject } from '@spotify-confidence/shared-kernel';

const KEY_ALIASES: Record<string, string> = {
  variants: 'variant',
  'add-variants': 'add-variant',
};

export function applyAliases(source: JsonObject): JsonObject {
  const out: JsonObject = {};
  for (const [key, value] of Object.entries(source)) {
    out[KEY_ALIASES[key] ?? key] = value;
  }
  return out;
}
