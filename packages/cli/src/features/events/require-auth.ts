import { loadPersistedToken, validateToken, extractRegion } from '@spotify-confidence/core';
import { fail } from '@output/print.js';
import type { Region } from '@spotify-confidence/core';

export function requireAuth(profile?: string): { token: string; region: Region } | null {
  const token = loadPersistedToken(profile);
  if (!token) {
    fail('Not logged in. Run "confidence login" first.');
    return null;
  }

  const validation = validateToken(token);
  if (!validation.valid) {
    fail('Token expired. Run "confidence login" to re-authenticate.');
    return null;
  }

  const region = extractRegion(token);
  return { token, region };
}
