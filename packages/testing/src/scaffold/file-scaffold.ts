import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function writeJsonFile(dir: string, filename: string, data: unknown): string {
  const filePath = join(dir, filename);
  writeFileSync(filePath, JSON.stringify(data));
  return filePath;
}
