import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { noop } from '@lib/noop.js';
import { buildTestJwt } from './jwt.js';
import type { TokenType } from './types.js';

const TOKEN_PATH = join(tmpdir(), 'confidence_token');
const REFRESH_TOKEN_PATH = join(tmpdir(), 'confidence_refresh_token');

const TOKEN_CONFIG = { encoding: 'utf-8', mode: 0o600 } as const;
const DEFAULT_EMAIL = 'existing@example.com';

const SCAFFOLDS: Record<TokenType, () => void> = {
  none: noop,
  valid: () => writeToken(buildTestJwt({ email: DEFAULT_EMAIL })),
  'with-refresh': () => {
    writeToken(buildTestJwt({ email: DEFAULT_EMAIL }));
    writeRefreshToken('test-refresh-token');
  },
};

/**
 * Writes auth token files to the temp directory with the requested
 * scaffold. Supports `Symbol.dispose` for automatic cleanup.
 *
 * @param type - A named scaffold.
 *   @defaultValue `'valid'`
 * @returns An object with a disposer that removes the token files.
 *
 * @example
 * ```ts
 * using _auth = prepareAuthTokens('none');
 * using _auth = prepareAuthTokens('valid');
 * using _auth = prepareAuthTokens('with-refresh');
 * ```
 */
export function prepareAuthTokens(type: TokenType = 'valid') {
  clearAuthTokens();

  SCAFFOLDS[type]();

  return {
    [Symbol.dispose]() {
      clearAuthTokens();
    },
  };
}

function clearAuthTokens(): void {
  try {
    unlinkSync(TOKEN_PATH);
  } catch {
    // File may not exist, ignore.
  }

  try {
    unlinkSync(REFRESH_TOKEN_PATH);
  } catch {
    // File may not exist, ignore.
  }
}

function writeToken(token: string): void {
  writeFileSync(TOKEN_PATH, token, TOKEN_CONFIG);
}

function writeRefreshToken(refreshToken: string): void {
  writeFileSync(REFRESH_TOKEN_PATH, refreshToken, TOKEN_CONFIG);
}
