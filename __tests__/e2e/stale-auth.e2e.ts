import {
  createSession,
  navigatePastWelcome,
  simulateAuthCallback,
  buildTestJwt,
  ENTER,
} from './helpers/index.js';

function buildExpiredJwt(): string {
  return buildTestJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
}

describe('when auth token is stale', () => {
  it('prompts user to sign in again instead of using the expired token', async () => {
    using session = createSession({ token: buildExpiredJwt() });

    await navigatePastWelcome(session);

    // Authenticate — expired token should be rejected, showing choose-action
    await session.waitForText('Sign in to a Confidence account');
    expect(session.snapshot()).toMatchSnapshot('auth-expired');
  });

  it('shows "Use existing account" when the token is still valid', async () => {
    using session = createSession({ token: buildTestJwt() });

    await navigatePastWelcome(session);

    // Authenticate — valid token found
    await session.waitForText('Use existing account');
    expect(session.snapshot()).toMatchSnapshot('auth-existing');
  });

  it('allows re-authentication after expired token and proceeds normally', async () => {
    using session = createSession({ token: buildExpiredJwt() });

    await navigatePastWelcome(session);

    // Authenticate — sign in fresh
    await session.waitForText('Sign in to a Confidence account');
    await session.sendKey(ENTER);
    await session.waitForText('Waiting for browser');
    await simulateAuthCallback();
    await session.waitForText('Authenticated');

    // Continues to InstallPlugins
    await session.waitForText('Which agent tool are you using?');
    expect(session.snapshot()).toMatchSnapshot('auth-re-authenticated');
  });

  it('treats a near-expiry token as valid', async () => {
    const nearExpiryJwt = buildTestJwt({ exp: Math.floor(Date.now() / 1000) + 5 });
    using session = createSession({ token: nearExpiryJwt });

    await navigatePastWelcome(session);

    // Token expires in 5s — no buffer in validateToken, so still accepted
    await session.waitForText('Use existing account');
    expect(session.snapshot()).toMatchSnapshot('auth-near-expiry');
  });

  it('treats a malformed token as invalid and prompts sign-in', async () => {
    using session = createSession({ token: 'not.a.valid.jwt' });

    await navigatePastWelcome(session);

    // Malformed JWT cannot be decoded — treated as invalid
    await session.waitForText('Sign in to a Confidence account');
    expect(session.snapshot()).toMatchSnapshot('auth-malformed');
  });
});
