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

export function withAuth(
  fn: (argv: Record<string, unknown>, token: string) => Promise<void>,
): (argv: Record<string, unknown>) => Promise<void> {
  return async (argv) => {
    const token = requireAuth(argv.profile as string | undefined);
    if (!token) return;
    await fn(argv, token);
  };
}
