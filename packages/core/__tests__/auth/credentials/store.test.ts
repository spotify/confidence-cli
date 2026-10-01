import { existsSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import {
  readCredentials,
  writeCredentials,
  clearTokens,
  getConfigDir,
  credentialsPath,
} from '@auth/credentials/index.js';

describe('writeCredentials / readCredentials', () => {
  it('round-trips credentials through the filesystem', () => {
    using _auth = prepareAuthTokens('none');
    const creds = { accessToken: 'tok', refreshToken: 'ref', organization: 'org' };

    writeCredentials(creds);
    const sut = readCredentials();

    expect(sut).toEqual(creds);
  });

  it('creates the config directory with 0700 permissions', () => {
    using _auth = prepareAuthTokens('none');

    writeCredentials({ accessToken: 'tok' });

    const dir = getConfigDir();
    const mode = statSync(dir).mode & 0o777;
    expect(mode).toBe(0o700);
  });

  it('writes the credentials file with 0600 permissions', () => {
    using _auth = prepareAuthTokens('none');

    writeCredentials({ accessToken: 'tok' });

    const path = join(getConfigDir(), 'credentials.json');
    const mode = statSync(path).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('writes profile credentials to a subdirectory', () => {
    using _auth = prepareAuthTokens('none');

    writeCredentials({ accessToken: 'tok' }, 'staging');
    const sut = readCredentials('staging');

    expect(sut?.accessToken).toBe('tok');
    expect(existsSync(join(getConfigDir(), 'profiles', 'staging', 'credentials.json'))).toBe(true);
  });
});

describe('clearTokens', () => {
  it('removes the credentials file', () => {
    using _auth = prepareAuthTokens('valid');

    clearTokens();

    expect(existsSync(join(getConfigDir(), 'credentials.json'))).toBe(false);
  });

  it('removes the profile directory', () => {
    using _auth = prepareAuthTokens('none');
    writeCredentials({ accessToken: 'tok' }, 'staging');

    clearTokens('staging');

    expect(existsSync(join(getConfigDir(), 'profiles', 'staging'))).toBe(false);
  });

  it('does not throw when no credentials exist', () => {
    using _auth = prepareAuthTokens('none');

    expect(() => clearTokens()).not.toThrow();
  });

  it('leaves profile directory if it contains other files', () => {
    using _auth = prepareAuthTokens('none');
    writeCredentials({ accessToken: 'tok' }, 'staging');
    const profileDir = join(getConfigDir(), 'profiles', 'staging');
    writeFileSync(join(profileDir, 'extra.json'), '{}');

    clearTokens('staging');

    expect(existsSync(join(profileDir, 'credentials.json'))).toBe(false);
    expect(existsSync(profileDir)).toBe(true);
  });
});

describe('credentialsPath', () => {
  it('rejects profile names with path traversal characters', () => {
    expect(() => credentialsPath('../../etc')).toThrow(/Only lowercase letters/);
  });

  it('rejects profile names with uppercase letters', () => {
    expect(() => credentialsPath('MyProfile')).toThrow(/Only lowercase letters/);
  });

  it('rejects empty profile names', () => {
    expect(() => credentialsPath('')).not.toThrow();
  });

  it('accepts valid profile names', () => {
    expect(() => credentialsPath('my-profile_01')).not.toThrow();
  });
});
