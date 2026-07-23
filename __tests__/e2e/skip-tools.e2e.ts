import { createSession, navigateToConnectTools, ENTER, ARROW_DOWN } from './helpers/index.js';

describe('when the user skips connecting tools', () => {
  it('shows skip message and proceeds to onboarding', async () => {
    using session = createSession();

    await navigateToConnectTools(session);

    // Select "Skip for now" — 4th option (after "Connect all tools", 2 individual tools)
    await session.sendKeyRepeat(ARROW_DOWN, 3);
    await session.sendKey(ENTER);

    // Skip confirmation text
    await session.waitForText('Skipped');

    // Still proceeds to OnboardProject
    await session.waitForText('Start onboarding?');
    await session.sendKey(ENTER);
    await session.waitForText('onboarding complete', { timeout: 60_000 });

    await session.waitForText('Confidence is ready');
    expect(session.snapshot()).toMatchSnapshot('done-tools-skipped');
  });
});
