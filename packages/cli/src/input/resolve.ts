import type { JsonObject } from '@spotify-confidence/shared-kernel';
import { readFileData } from './read-file.js';
import { applyAliases } from './aliases.js';

function pickDefined(source: JsonObject, keys: string[]): JsonObject {
  const out: JsonObject = {};
  for (const key of keys) {
    if (source[key] != null) out[key] = source[key];
  }
  return out;
}

export function resolveInput<T extends JsonObject>(argv: JsonObject, keys: string[]): T;
export function resolveInput<T extends JsonObject>(argv: JsonObject, defaults: () => T): T;
export function resolveInput<T extends JsonObject>(
  argv: JsonObject,
  keysOrDefaults: string[] | (() => T),
): T {
  const fileData = applyAliases(readFileData(argv));

  if (typeof keysOrDefaults === 'function') {
    if (Object.keys(fileData).length > 0) return fileData as T;
    return keysOrDefaults();
  }

  return { ...pickDefined(argv, keysOrDefaults), ...fileData } as T;
}
