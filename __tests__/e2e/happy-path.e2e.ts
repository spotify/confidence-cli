import { createSession, simulateAuthCallback, ENTER, ARROW_DOWN } from './helpers/index.js';

describe('happy-path flow', () => {
  it('navigates Welcome → SystemCheck → Authenticate → InstallPlugins → ConnectTools → OnboardProject → Done', async () => {
    using session = createSession();

    // Welcome
    await session.waitForText('Confidence Quickstart');
    await session.waitForText('Start setup');
    await session.sendKey(ENTER);

    // SystemCheck
    await session.waitForText('System Check');
    await session.waitForText('All checks passed');

    // Authenticate
    await session.waitForText('Sign in to Confidence');
    await session.waitForText('Sign in to a Confidence account');
    await session.sendKey(ENTER);
    await session.waitForText('Waiting for browser');
    await simulateAuthCallback();
    await session.waitForText('Authenticated');

    // InstallPlugins
    await session.waitForText('Teach your AI');
    await session.waitForText('Which agent tool are you using?');
    await session.sendKey(ENTER);
    await session.waitForText('Plugin installed successfully');

    // ConnectTools
    await session.waitForText('Connect your AI to Confidence');
    await session.waitForText('Connect Confidence tools?');
    await session.sendKey(ENTER);
    await session.waitForText('Connected successfully');

    // OnboardProject
    await session.waitForText('Start onboarding?');
    await session.sendKey(ENTER);
    await session.waitForText('Installing @spotify-confidence/sdk');
    await session.waitForText('onboarding complete', { timeout: 60_000 });

    // Done
    await session.waitForText('Confidence is ready');
    await session.waitForText("What's next?");
    await session.sendKey(ARROW_DOWN);
    await session.sendKey(ENTER);

    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(0);
  });
});
