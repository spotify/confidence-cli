import { env } from '../../system/env.js';
import { readCredentials } from './store.js';

export function loadPersistedToken(profile?: string): string | null {
  const envToken = env('CONFIDENCE_TOKEN');
  if (envToken) return envToken;

  const creds = readCredentials(profile);
  return creds?.accessToken ?? null;
}
