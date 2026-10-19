import { buildTestJwt, buildExpiredJwt } from '@spotify-confidence/testing/auth';
import { decodeJwtPayload, isValidToken, extractWorkspace } from '@auth/jwt.js';

describe('decodeJwtPayload', () => {
  it('decodes a valid JWT payload', () => {
    const sut = decodeJwtPayload;
    const token = buildTestJwt({ email: 'test@example.com' });

    const payload = sut(token);

    expect(payload.email).toBe('test@example.com');
  });

  it('throws on an invalid JWT', () => {
    const sut = decodeJwtPayload;

    expect(() => sut('not-a-jwt')).toThrow('Invalid JWT');
  });
});

describe('isValidToken', () => {
  it('returns true for a non-expired token', () => {
    const token = buildTestJwt({ 'https://confidence.dev/region': 'EU' });

    expect(isValidToken(token)).toBe(true);
  });

  it('returns false for an expired token', () => {
    expect(isValidToken(buildExpiredJwt())).toBe(false);
  });
});

describe('extractWorkspace', () => {
  it('extracts workspace from account_name', () => {
    const token = buildTestJwt({
      'https://confidence.dev/account_name': 'Acme Corp',
      email: 'user@acme.com',
    });

    expect(extractWorkspace(token)).toBe('Acme Corp');
  });

  it('falls back to email when account_name is absent', () => {
    const token = buildTestJwt({ email: 'user@acme.com' });

    expect(extractWorkspace(token)).toBe('user@acme.com');
  });
});
