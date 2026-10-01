import {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
  rmdirSync,
  chmodSync,
} from 'node:fs';
import { join } from 'node:path';
import { credentialsPath } from './paths.js';

export type Credentials = {
  accessToken: string;
  refreshToken?: string;
  organization?: string;
};

export function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
}

export function readCredentials(profile?: string): Credentials | null {
  const path = credentialsPath(profile);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Credentials;
  } catch {
    return null;
  }
}

export function writeCredentials(creds: Credentials, profile?: string): void {
  const path = credentialsPath(profile);
  ensureDir(join(path, '..'));
  writeFileSync(path, JSON.stringify(creds, null, 2), { encoding: 'utf-8', mode: 0o600 });
}

export function clearTokens(profile?: string): void {
  const path = credentialsPath(profile);
  if (!existsSync(path)) return;
  try {
    unlinkSync(path);
    if (profile) {
      try {
        rmdirSync(join(path, '..'));
      } catch {
        /* non-empty dir — leave it */
      }
    }
  } catch {
    // best-effort
  }
}
