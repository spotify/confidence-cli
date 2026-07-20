import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { TerminalSession, simulateAuthCallback, buildTestJwt, ENTER } from './helpers/index.js';

function buildExpiredJwt(): string {
  return buildTestJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
}

function createSessionWithToken(jwt: string): TerminalSession {
  const mockBinDir = process.env.E2E_MOCK_BIN_DIR!;
  const projectDir = mkdtempSync(join(tmpdir(), 'e2e-project-'));
  writeFileSync(
    join(projectDir, 'package.json'),
    JSON.stringify({ dependencies: { react: '^19.0.0' } }),
  );

  // Pre-seed the token in an isolated tmpdir
  const customTmpDir = mkdtempSync(join(tmpdir(), 'e2e-tmp-'));
  writeFileSync(join(customTmpDir, 'confidence_token'), jwt, 'utf-8');

  return new TerminalSession({
    args: ['--debug', '--dir', projectDir],
    env: {
      PATH: `${mockBinDir}:${process.env.PATH}`,
      TMPDIR: customTmpDir,
    },
    cwd: projectDir,
  });
}

describe('when auth token is stale', () => {
  it('prompts user to sign in again instead of using the expired token', async () => {
    using session = createSessionWithToken(buildExpiredJwt());

    // Welcome
    await session.waitForText('Start setup');
    await session.sendKey(ENTER);
    await session.waitForText('All checks passed');

    // Authenticate — expired token should be rejected, showing choose-action
    await session.waitForText('Sign in to a Confidence account');
  });

  it('shows "Use existing account" when the token is still valid', async () => {
    const validJwt = buildTestJwt();
    using session = createSessionWithToken(validJwt);

    await session.waitForText('Start setup');
    await session.sendKey(ENTER);
    await session.waitForText('All checks passed');

    // Authenticate — valid token found
    await session.waitForText('Use existing account');
  });

  it('allows re-authentication after expired token and proceeds normally', async () => {
    using session = createSessionWithToken(buildExpiredJwt());

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
});
