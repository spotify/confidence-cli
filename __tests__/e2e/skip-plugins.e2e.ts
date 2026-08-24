import { createSession, navigateToPlugins } from './testing-framework/index.js';

describe('when the user skips installing AI plugin', () => {
  it('does not show "Continue work with" on the Done screen', async () => {
    using session = createSession();

    await navigateToPlugins(session);

    // Select "Skip (install manually later)" — 4th option
    await session.pressRepeat('ArrowDown', 3);
    await session.press('Enter');

    // ConnectTools
    await session.waitForText('Connect Confidence tools?');
    await session.press('Enter');
    await session.waitForText('Connected successfully');

    // SelectGoal
    await session.waitForText("Select the features you'd like to set up");
    await session.press('Space');
    await session.press('Enter');

    // OnboardProject
    await session.waitForText('Start onboarding?');
    await session.press('Enter');
    await session.waitForText('onboarding complete', { timeout: 30_000 });

    // Done — no IDE set, so only "Exit" option (no "Continue work with")
    await session.waitForText('Confidence is ready');
    await session.waitForText("What's next?");
    await session.waitForText('Exit');
    expect(session.snapshot()).toMatchSnapshot('done-no-ide');

    await session.press('Enter');
    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(0);
  });

  it('still shows report file and code changes on the Done screen', async () => {
    using session = createSession();

    await navigateToPlugins(session);

    // Skip plugins
    await session.pressRepeat('ArrowDown', 3);
    await session.press('Enter');

    // Connect + onboard
    await session.waitForText('Connect Confidence tools?');
    await session.press('Enter');
    await session.waitForText('Connected successfully');

    // SelectGoal
    await session.waitForText("Select the features you'd like to set up");
    await session.press('Space');
    await session.press('Enter');

    await session.waitForText('Start onboarding?');
    await session.press('Enter');
    await session.waitForText('onboarding complete', { timeout: 30_000 });

    // Done — onboarding ran so report file and code changes appear
    await session.waitForText('What we have set up');
    await session.waitForText('CONFIDENCE_QUICKSTART.md');
    expect(session.snapshot()).toMatchSnapshot('done-no-ide-with-report');
  });
});
