import { loadPersistedToken, validateToken } from '@spotify-confidence/core';
import { fail } from '@output/print.js';

export function requireAuth(profile?: string): string | null {
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

  return token;
}
