import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { noop } from '@spotify-confidence/shared-kernel';
import { buildTestJwt } from './jwt.js';
import type { TokenType } from './types.js';

const FILE_CONFIG = { encoding: 'utf-8', mode: 0o600 } as const;
const DEFAULT_EMAIL = 'existing@example.com';

const SCAFFOLDS: Record<TokenType, (dir: string) => void> = {
  none: noop,
  valid: (dir) => writeCredentials(dir, { accessToken: buildTestJwt({ email: DEFAULT_EMAIL }) }),
  'with-refresh': (dir) =>
    writeCredentials(dir, {
      accessToken: buildTestJwt({ email: DEFAULT_EMAIL }),
      refreshToken: 'test-refresh-token',
    }),
  expired: (dir) =>
    writeCredentials(dir, {
      accessToken: buildTestJwt({ exp: Math.floor(Date.now() / 1000) - 3600 }),
    }),
};

type Credentials = {
  accessToken: string;
  refreshToken?: string;
  organization?: string;
};

function writeCredentials(configDir: string, creds: Credentials): void {
  mkdirSync(configDir, { recursive: true });
  writeFileSync(join(configDir, 'credentials.json'), JSON.stringify(creds, null, 2), FILE_CONFIG);
}

/**
 * Creates an isolated config directory with the requested credential
 * scaffold and sets `CONFIDENCE_CONFIG_DIR` to point to it. Supports
 * `Symbol.dispose` for automatic cleanup.
 *
 * @param type - A named scaffold.
 *   @defaultValue `'valid'`
 * @returns An object with a disposer that removes the config directory.
 *
 * @example
 * ```ts
 * using _auth = prepareAuthTokens('none');
 * using _auth = prepareAuthTokens('valid');
 * using _auth = prepareAuthTokens('with-refresh');
 * ```
 */
export function prepareAuthTokens(type: TokenType = 'valid') {
  const configDir = mkdtempSync(join(tmpdir(), 'confidence-auth-test-'));
  process.env['CONFIDENCE_CONFIG_DIR'] = configDir;

  SCAFFOLDS[type](configDir);

  return {
    [Symbol.dispose]() {
      delete process.env['CONFIDENCE_CONFIG_DIR'];
      try {
        rmSync(configDir, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    },
  };
}
