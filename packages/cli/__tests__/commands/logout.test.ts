import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { clearTokens, getConfigDir } from '@spotify-confidence/core';

describe('logout (clearTokens)', () => {
  it('removes the default credentials file', () => {
    using _auth = prepareAuthTokens('valid');

    clearTokens();

    expect(existsSync(join(getConfigDir(), 'credentials.json'))).toBe(false);
  });

  it('does not throw when already logged out', () => {
    using _auth = prepareAuthTokens('none');

    expect(() => clearTokens()).not.toThrow();
  });
});
