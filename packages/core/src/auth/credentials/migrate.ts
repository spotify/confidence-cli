import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { credentialsPath } from './paths.js';
import { writeCredentials } from './store.js';

const LEGACY_TOKEN_FILE = join(tmpdir(), 'confidence_token');
const LEGACY_REFRESH_TOKEN_FILE = join(tmpdir(), 'confidence_refresh_token');
const LEGACY_ORGANIZATION_FILE = join(tmpdir(), 'confidence_organization');

let migrationDone = false;

export function migrateLegacyTokens(): void {
  if (migrationDone) return;
  migrationDone = true;

  const newPath = credentialsPath();
  if (existsSync(newPath)) return;
  if (!existsSync(LEGACY_TOKEN_FILE)) return;

  try {
    const accessToken = readFileSync(LEGACY_TOKEN_FILE, 'utf-8').trim();
    if (!accessToken) return;

    let refreshToken: string | undefined;
    if (existsSync(LEGACY_REFRESH_TOKEN_FILE)) {
      refreshToken = readFileSync(LEGACY_REFRESH_TOKEN_FILE, 'utf-8').trim() || undefined;
    }

    let organization: string | undefined;
    if (existsSync(LEGACY_ORGANIZATION_FILE)) {
      organization = readFileSync(LEGACY_ORGANIZATION_FILE, 'utf-8').trim() || undefined;
    }

    writeCredentials({ accessToken, refreshToken, organization });

    try {
      unlinkSync(LEGACY_TOKEN_FILE);
    } catch {
      /* best-effort cleanup */
    }
    try {
      unlinkSync(LEGACY_REFRESH_TOKEN_FILE);
    } catch {
      /* best-effort cleanup */
    }
    try {
      unlinkSync(LEGACY_ORGANIZATION_FILE);
    } catch {
      /* best-effort cleanup */
    }
  } catch {
    // Migration is best-effort; don't block auth flow.
  }
}
