import { createSession, navigateToConnectTools } from './testing-framework/index.js';

describe('when the user skips connecting tools', () => {
  it('shows skip message and proceeds to onboarding', async () => {
    using session = createSession();

    await navigateToConnectTools(session);

    // Select "Skip for now" — 4th option (after "Connect all tools", 2 individual tools)
    await session.pressRepeat('ArrowDown', 3);
    await session.press('Enter');

    // Skip confirmation text
    await session.waitForText('Skipped');

    // OnboardProject (goals were already selected before plugins)
    await session.waitForText('Start onboarding?');
    await session.press('Enter');
    await session.waitForText('onboarding complete', { timeout: 30_000 });

    session.checkpoint();
    await session.waitForText('Confidence is ready');
    await session.waitForText("What's next?");
    expect(session.snapshot()).toMatchSnapshot('done-tools-skipped');
  });
});
