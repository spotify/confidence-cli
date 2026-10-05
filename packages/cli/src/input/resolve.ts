import type { JsonObject } from '@spotify-confidence/shared-kernel';
import { warn } from '@output/index.js';
import { readFileData } from './read-file.js';
import { applyAliases } from './aliases.js';

function pickDefined(source: JsonObject, keys: string[]): JsonObject {
  const out: JsonObject = {};

  for (const key of keys) {
    if (source[key] != null) {
      out[key] = source[key];
    }
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

  const unknown = Object.keys(fileData).filter((k) => !keysOrDefaults.includes(k));
  if (unknown.length > 0) {
    warn(`unknown keys in file ignored: ${unknown.join(', ')}`);
  }

  return { ...pickDefined(argv, keysOrDefaults), ...pickDefined(fileData, keysOrDefaults) } as T;
}
