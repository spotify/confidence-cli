import { readFileSync } from 'node:fs';

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

function normalizeKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    out[toKebab(key)] = value;
  }
  return out;
}

export function resolveTargetFile<T extends Record<string, unknown>>(
  argv: Record<string, unknown>,
  defaults: () => T,
  { merge }: { merge?: boolean } = {},
): T {
  const filePath = argv['from-file'] as string | undefined;

  if (!filePath) return defaults();

  const fileData = normalizeKeys(readJsonFile<Record<string, unknown>>(filePath));
  if (!merge) return fileData as T;

  return { ...defaults(), ...fileData } as T;
}
