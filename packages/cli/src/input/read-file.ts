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

export function readFileData(argv: JsonObject): JsonObject {
  const filePath = argv['from-file'] as string | undefined;
  if (!filePath) return {};
  return normalizeKeys(readJsonFile<JsonObject>(filePath));
}
