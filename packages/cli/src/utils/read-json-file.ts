import { readFileSync } from 'node:fs';

export function readJsonFile<T>(filePath: string): T {
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
