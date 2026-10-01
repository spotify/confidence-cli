import { buildTestJwt, buildExpiredJwt } from '@spotify-confidence/testing/auth';
import { decodeJwtPayload, validateToken } from '@auth/jwt.js';

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

describe('validateToken', () => {
  it('returns valid for a non-expired token', () => {
    const sut = validateToken;
    const token = buildTestJwt({ 'https://confidence.dev/region': 'EU' });

    const result = sut(token);

    expect(result.valid).toBe(true);
    expect(result.region).toBe('EU');
  });

  it('returns invalid for an expired token', () => {
    const sut = validateToken;

    expect(sut(buildExpiredJwt()).valid).toBe(false);
  });

  it('extracts the workspace from account_name or email', () => {
    const sut = validateToken;
    const token = buildTestJwt({
      'https://confidence.dev/account_name': 'Acme Corp',
      email: 'user@acme.com',
    });

    expect(sut(token).workspace).toBe('Acme Corp');
  });
});
