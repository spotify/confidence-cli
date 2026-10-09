import { homedir } from 'node:os';
import { join } from 'node:path';
import { env } from '../system/env.js';

export function getConfigDir(): string {
  return env('CONFIDENCE_CONFIG_DIR') ?? join(homedir(), '.config', 'confidence');
}
