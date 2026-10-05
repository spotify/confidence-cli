import { readFileSync } from 'node:fs';
import type { JsonObject } from '@spotify-confidence/shared-kernel';

function readJsonFile<T>(filePath: string): T {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Could not read file "${filePath}": ${(err as Error).message}`, { cause: err });
  }

  try {
    return JSON.parse(content) as T;
  } catch (err) {
    throw new Error(`Invalid JSON in "${filePath}".`, { cause: err });
  }
}

function toKebab(key: string): string {
  return key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}

function normalizeKeys(obj: JsonObject): JsonObject {
  const out: JsonObject = {};
  for (const [key, value] of Object.entries(obj)) {
    out[toKebab(key)] = value;
  }
  return out;
}

function readFileData(argv: JsonObject): JsonObject {
  const filePath = argv['from-file'] as string | undefined;
  if (!filePath) return {};
  return normalizeKeys(readJsonFile<JsonObject>(filePath));
}

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
  const fileData = readFileData(argv);

  if (typeof keysOrDefaults === 'function') {
    if (Object.keys(fileData).length > 0) return fileData as T;
    return keysOrDefaults();
  }

  return { ...pickDefined(argv, keysOrDefaults), ...fileData } as T;
}
