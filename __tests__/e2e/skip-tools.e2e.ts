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

    // SelectGoal
    await session.waitForText('Which features would you like to set up?');
    await session.press('Enter');

    // OnboardProject
    await session.waitForText('Start onboarding?');
    await session.press('Enter');
    await session.waitForText('onboarding complete', { timeout: 30_000 });

    await session.waitForText('Confidence is ready');
    expect(session.snapshot()).toMatchSnapshot('done-tools-skipped');
  });
});
