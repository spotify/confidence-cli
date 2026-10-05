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

export function resolveTargetFile<T>(argv: Record<string, unknown>, fromArgv: () => T): T {
  const filePath = argv['from-file'] as string | undefined;
  if (filePath) return readJsonFile<T>(filePath);
  return fromArgv();
}
