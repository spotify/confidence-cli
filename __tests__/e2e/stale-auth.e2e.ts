import { createSession, simulateAuthCallback, buildTestJwt, ENTER } from './helpers/index.js';

function buildExpiredJwt(): string {
  return buildTestJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
}

describe('when auth token is stale', () => {
  it('prompts user to sign in again instead of using the expired token', async () => {
    using session = createSession({ token: buildExpiredJwt() });

    // Welcome
    await session.waitForText('Start setup');
    await session.sendKey(ENTER);
    await session.waitForText('All checks passed');

    // Authenticate — expired token should be rejected, showing choose-action
    await session.waitForText('Sign in to a Confidence account');
  });

  it('shows "Use existing account" when the token is still valid', async () => {
    using session = createSession({ token: buildTestJwt() });

    await session.waitForText('Start setup');
    await session.sendKey(ENTER);
    await session.waitForText('All checks passed');

    // Authenticate — valid token found
    await session.waitForText('Use existing account');
  });

  it('allows re-authentication after expired token and proceeds normally', async () => {
    using session = createSession({ token: buildExpiredJwt() });

    await session.waitForText('Start setup');
    await session.sendKey(ENTER);
    await session.waitForText('All checks passed');

    // Authenticate — sign in fresh
    await session.waitForText('Sign in to a Confidence account');
    await session.sendKey(ENTER);
    await session.waitForText('Waiting for browser');
    await simulateAuthCallback();
    await session.waitForText('Authenticated');

    // Continues to InstallPlugins
    await session.waitForText('Which agent tool are you using?');
  });

  it('treats a near-expiry token as valid', async () => {
    const nearExpiryJwt = buildTestJwt({ exp: Math.floor(Date.now() / 1000) + 5 });
    using session = createSession({ token: nearExpiryJwt });

    await session.waitForText('Start setup');
    await session.sendKey(ENTER);
    await session.waitForText('All checks passed');

    // Token expires in 5s — no buffer in validateToken, so still accepted
    await session.waitForText('Use existing account');
  });

  it('treats a malformed token as invalid and prompts sign-in', async () => {
    using session = createSession({ token: 'not.a.valid.jwt' });

    await session.waitForText('Start setup');
    await session.sendKey(ENTER);
    await session.waitForText('All checks passed');

    // Malformed JWT cannot be decoded — treated as invalid
    await session.waitForText('Sign in to a Confidence account');
  });
});
