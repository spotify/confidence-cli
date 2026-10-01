import { buildTestJwt, prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { loadPersistedToken } from '@auth/credentials/load.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('loadPersistedToken', () => {
  it('returns the persisted token', () => {
    using _auth = prepareAuthTokens('valid');

    expect(loadPersistedToken()).not.toBeNull();
  });

  it('returns null when no token exists', () => {
    using _auth = prepareAuthTokens('none');

    expect(loadPersistedToken()).toBeNull();
  });

  it('returns CONFIDENCE_TOKEN env var when set', () => {
    using _auth = prepareAuthTokens('valid');
    const envToken = buildTestJwt({ email: 'ci@example.com' });
    vi.stubEnv('CONFIDENCE_TOKEN', envToken);

    expect(loadPersistedToken()).toBe(envToken);
  });
});
