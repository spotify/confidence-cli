import { createSession, navigatePastWelcome, buildTestJwt } from './testing-framework/index.js';

describe('when IDE is saved in config from a previous run', () => {
  it('auto-selects the saved IDE and skips the selection step', async () => {
    using session = createSession({
      token: buildTestJwt(),
      config: { ide: 'cursor' },
    });

    await navigatePastWelcome(session);

    // Auth — use existing account (token was pre-seeded)
    await session.waitForText('Use existing account');
    await session.press('Enter');
    await session.waitForText('Authenticated');

    // SelectGoal
    await session.waitForText("Select the features you'd like to set up");
    session.checkpoint();
    await session.press('Space');
    await session.press('Enter');

    // InstallPlugins — should auto-select cursor without showing the IDE picker
    await session.waitForText('Plugin set up successfully');
    session.checkpoint();

    // ConnectTools — confirms we advanced past InstallPlugins
    await session.waitForText('Teach your AI Confidence');
  });
});
