import { join } from 'node:path';
import { getConfigDir } from '../../config/paths.js';

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
