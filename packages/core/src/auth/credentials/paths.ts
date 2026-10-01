import { homedir } from 'node:os';
import { join } from 'node:path';
import { env } from '../../system/env.js';

export function getConfigDir(): string {
  return env('CONFIDENCE_CONFIG_DIR') ?? join(homedir(), '.config', 'confidence');
}

const VALID_PROFILE = /^[a-z0-9_-]+$/;

export function credentialsPath(profile?: string): string {
  const base = getConfigDir();

  if (profile) {
    if (!VALID_PROFILE.test(profile)) {
      throw new Error(`Only lowercase letters, digits, hyphens, and underscores are allowed.`);
    }
    return join(base, 'profiles', profile, 'credentials.json');
  }

  return join(base, 'credentials.json');
}
