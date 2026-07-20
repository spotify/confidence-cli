import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { interpolate } from '../../prompt-utils.js';

const STEPS_DIR = dirname(fileURLToPath(import.meta.url));

export function loadStep(filename: string, vars: Record<string, string | number> = {}): string {
  const raw = readFileSync(join(STEPS_DIR, filename), 'utf-8').trimEnd();
  return Object.keys(vars).length > 0 ? interpolate(raw, vars) : raw;
}
