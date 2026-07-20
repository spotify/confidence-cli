import { createSession, navigateToPlugins, ENTER, ARROW_DOWN } from './helpers/index.js';

describe('when the user skips installing AI plugin', () => {
  it('does not show "Continue work with" on the Done screen', async () => {
    using session = createSession();

    await navigateToPlugins(session);

    // Select "Skip (install manually later)" — 4th option
    await session.sendKey(ARROW_DOWN);
    await session.sendKey(ARROW_DOWN);
    await session.sendKey(ARROW_DOWN);
    await session.sendKey(ENTER);

    // ConnectTools
    await session.waitForText('Connect Confidence tools?');
    await session.sendKey(ENTER);
    await session.waitForText('Connected successfully');

    // OnboardProject
    await session.waitForText('Start onboarding?');
    await session.sendKey(ENTER);
    await session.waitForText('onboarding complete', { timeout: 60_000 });

    // Done — no IDE set, so only "Exit" option (no "Continue work with")
    await session.waitForText('Confidence is ready');
    await session.waitForText("What's next?");
    await session.waitForText('Exit');

    await session.sendKey(ENTER);
    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(0);
  });

  it('still shows report file and code changes on the Done screen', async () => {
    using session = createSession();

    await navigateToPlugins(session);

    // Skip plugins
    await session.sendKey(ARROW_DOWN);
    await session.sendKey(ARROW_DOWN);
    await session.sendKey(ARROW_DOWN);
    await session.sendKey(ENTER);

    // Connect + onboard
    await session.waitForText('Connect Confidence tools?');
    await session.sendKey(ENTER);
    await session.waitForText('Connected successfully');

    await session.waitForText('Start onboarding?');
    await session.sendKey(ENTER);
    await session.waitForText('onboarding complete', { timeout: 60_000 });

    // Done — onboarding ran so report file and code changes appear
    await session.waitForText('What we set up');
    await session.waitForText('CONFIDENCE_QUICKSTART.md');
  });
});
