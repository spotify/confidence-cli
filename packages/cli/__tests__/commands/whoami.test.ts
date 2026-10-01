import { buildTestJwt, buildExpiredJwt, prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { loadPersistedToken, validateToken, decodeJwtPayload } from '@spotify-confidence/core';

describe('whoami prerequisites', () => {
  it('loads and validates a persisted token', () => {
    using _auth = prepareAuthTokens('valid');

    const token = loadPersistedToken();

    expect(token).not.toBeNull();
    expect(validateToken(token!).valid).toBe(true);
  });

  it('decodes email from the token payload', () => {
    using _auth = prepareAuthTokens('valid');
    const token = loadPersistedToken()!;

    const payload = decodeJwtPayload(token);

    expect(payload.email).toBe('existing@example.com');
  });

  it('detects an expired token', () => {
    const sut = validateToken;

    expect(sut(buildExpiredJwt()).valid).toBe(false);
  });

  it('reads CONFIDENCE_TOKEN env var over persisted tokens', () => {
    using _auth = prepareAuthTokens('valid');
    const envToken = buildTestJwt({ email: 'ci@example.com' });
    vi.stubEnv('CONFIDENCE_TOKEN', envToken);

    const sut = loadPersistedToken();

    expect(sut).toBe(envToken);
  });
});
