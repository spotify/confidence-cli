import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createSession,
  navigatePastWelcome,
  navigatePastAuth,
  buildTestJwt,
  ENTER,
  ARROW_DOWN,
} from './helpers/index.js';

function buildExpiredJwt(): string {
  return buildTestJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
}

function writeExpiredMcpConfig(projectDir: string): void {
  const expired = buildExpiredJwt();
  const config = {
    mcpServers: {
      'confidence-flags': {
        type: 'http',
        url: 'https://mcp.confidence.dev/mcp/flags',
        headers: { Authorization: `Bearer ${expired}` },
      },
      'confidence-docs': {
        type: 'http',
        url: 'https://mcp.confidence.dev/mcp/docs',
        headers: { Authorization: `Bearer ${expired}` },
      },
    },
  };
  writeFileSync(join(projectDir, '.mcp.json'), JSON.stringify(config));
}

describe('when MCP config has expired auth tokens', () => {
  it('shows auth-expired status and reconnects successfully', async () => {
    using session = createSession();
    writeExpiredMcpConfig(session.cwd);

    // Welcome
    await session.waitForText('Start setup');
    await session.sendKey(ENTER);

    // SystemCheck
    await session.waitForText('All checks passed');

    // Authenticate
    await navigatePastAuth(session);

    // InstallPlugins
    await session.waitForText('Which agent tool are you using?');
    await session.sendKey(ENTER);

    // ConnectTools — should detect expired auth
    await session.waitForText('auth expired');
    await session.waitForText('Reconnect to refresh credentials?');
    await session.waitForText('Reconnect all tools');

    // Select "Reconnect all tools"
    await session.sendKey(ENTER);
    await session.waitForText('Connected successfully');
  });

  it('allows skipping when auth is expired', async () => {
    using session = createSession();
    writeExpiredMcpConfig(session.cwd);

    await navigatePastWelcome(session);
    await navigatePastAuth(session);

    // InstallPlugins
    await session.waitForText('Which agent tool are you using?');
    await session.sendKey(ENTER);

    // ConnectTools — skip instead of reconnecting
    await session.waitForText('Reconnect all tools');

    // Select "Skip for now" — 4th option (Reconnect all, 2 individual, Skip)
    await session.sendKeyRepeat(ARROW_DOWN, 3);
    await session.sendKey(ENTER);
    await session.waitForText('Skipped');

    // Proceeds to OnboardProject
    await session.waitForText('Start onboarding?');
  });
});
