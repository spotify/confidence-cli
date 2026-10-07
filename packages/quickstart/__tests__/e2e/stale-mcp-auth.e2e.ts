import {
  createSession,
  navigatePastWelcome,
  navigatePastGoalSelection,
  navigatePastAuth,
  buildTestJwt,
} from '@spotify-confidence/testing/e2e';
import { createProjectDir, writeClaudeGlobalConfig } from '@spotify-confidence/testing/scaffold';

function buildExpiredJwt(): string {
  return buildTestJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
}

const MCP_SERVERS = {
  'confidence-flags': { type: 'http', url: 'https://mcp.confidence.dev/mcp/flags' },
  'confidence-docs': { type: 'http', url: 'https://mcp.confidence.dev/mcp/docs' },
};

describe('when MCP config has expired auth tokens', () => {
  it('shows auth-expired status and reconnects successfully', async () => {
    const expiredToken = buildExpiredJwt();
    using home = createProjectDir('empty');
    using session = createSession({
      token: expiredToken,
      env: { HOME: home.path },
    });
    writeClaudeGlobalConfig(home.path, session.cwd, MCP_SERVERS);

    // Welcome
    await session.waitForText('Start setup');
    await session.press('Enter');

    // SystemCheck
    await session.waitForText('All checks passed');

    // SelectGoal
    await session.waitForText("Select the features you'd like to set up");
    await session.press('Space');
    await session.press('Enter');

    // Authenticate
    await navigatePastAuth(session);

    // InstallPlugins
    await session.waitForText('Which CLI agent would you like to use?');
    await session.press('Enter');

    // ConnectTools — should detect expired auth
    await session.waitForText('auth expired');
    await session.waitForText('Reconnect to refresh credentials?');
    await session.waitForText('Reconnect all tools');
    expect(session.snapshot()).toMatchSnapshot('connect-tools-expired');

    // Select "Reconnect all tools"
    await session.press('Enter');
    await session.waitForText('Connected successfully');
    expect(session.snapshot()).toMatchSnapshot('connect-tools-reconnected');
  });

  it('allows skipping when auth is expired', async () => {
    const expiredToken = buildExpiredJwt();
    using home = createProjectDir('empty');
    using session = createSession({
      token: expiredToken,
      env: { HOME: home.path },
    });
    writeClaudeGlobalConfig(home.path, session.cwd, MCP_SERVERS);

    await navigatePastWelcome(session);
    await navigatePastGoalSelection(session);
    await navigatePastAuth(session);

    // InstallPlugins
    await session.waitForText('Which CLI agent would you like to use?');
    await session.press('Enter');

    // ConnectTools — skip instead of reconnecting
    await session.waitForText('Reconnect all tools');

    // Select "Skip for now" — 4th option (Reconnect all, 2 individual, Skip)
    await session.pressRepeat('ArrowDown', 3);
    await session.press('Enter');
    await session.waitForText('Skipped');

    // OnboardProject
    await session.waitForText('Start onboarding?');
    expect(session.snapshot()).toMatchSnapshot('mcp-auth-skipped');
  });
});
