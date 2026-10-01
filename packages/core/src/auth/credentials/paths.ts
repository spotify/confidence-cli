import { homedir } from 'node:os';
import { join } from 'node:path';
import { env } from '../../system/env.js';

export function getConfigDir(): string {
  return env('CONFIDENCE_CONFIG_DIR') ?? join(homedir(), '.config', 'confidence');
}

export function credentialsPath(profile?: string): string {
  const base = getConfigDir();
  if (profile) return join(base, 'profiles', profile, 'credentials.json');
  return join(base, 'credentials.json');
}
