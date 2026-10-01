import { createSession, simulateAuthCallback } from './testing-framework/index.js';

describe('happy-path flow', () => {
  it('navigates Welcome → SystemCheck → Authenticate → InstallPlugins → ConnectTools → SelectGoal → OnboardProject → Done', async () => {
    using session = createSession();

    // Welcome
    await session.waitForText('Confidence Quickstart');
    await session.waitForText('Start setup');
    expect(session.snapshot()).toMatchSnapshot('welcome');
    session.checkpoint();
    await session.press('Enter');

    // SystemCheck
    await session.waitForText('System Check');
    await session.waitForText('All checks passed');
    expect(session.snapshot()).toMatchSnapshot('system-check');
    session.checkpoint();

    // Authenticate
    await session.waitForText('Sign in to Confidence');
    await session.waitForText('Sign in to a Confidence account');
    await session.press('Enter');
    await session.waitForText('Waiting for browser');
    await simulateAuthCallback();
    await session.waitForText('Authenticated');
    expect(session.snapshot()).toMatchSnapshot('authenticate');
    session.checkpoint();

    // InstallPlugins
    await session.waitForText('Select agent to set up');
    await session.waitForText('Which CLI agent would you like to use?');
    expect(session.snapshot()).toMatchSnapshot('install-plugins');
    session.checkpoint();
    await session.press('Enter');

    // ConnectTools
    await session.waitForText('Teach your AI Confidence');
    await session.waitForText('Connect Confidence tools?');
    expect(session.snapshot()).toMatchSnapshot('connect-tools');
    session.checkpoint();
    await session.press('Enter');
    await session.waitForText('Connected successfully');

    // SelectGoal
    await session.waitForText("Select the features you'd like to set up");
    expect(session.snapshot()).toMatchSnapshot('select-goal');
    session.checkpoint();
    await session.press('Space');
    await session.press('Enter');

    // OnboardProject
    await session.waitForText('Start onboarding?');
    expect(session.snapshot()).toMatchSnapshot('onboard-project');
    session.checkpoint();
    await session.press('Enter');
    await session.waitForText('Installing @spotify-confidence/sdk');
    await session.waitForText('onboarding complete', { timeout: 30_000 });

    // Done
    await session.waitForText('Confidence is ready');
    await session.waitForText("What's next?");
    expect(session.snapshot()).toMatchSnapshot('done');
    await session.press('ArrowDown');
    await session.press('Enter');

    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(0);
  });
});
