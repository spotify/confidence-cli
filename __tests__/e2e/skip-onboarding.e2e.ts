import { createSession, navigateToOnboarding } from './testing-framework/index.js';

describe('when the user skips onboarding', () => {
  it('shows Done screen without report file or code changes', async () => {
    using session = createSession();

    await navigateToOnboarding(session);

    // Select "Skip for now" — 2nd option
    await session.press('ArrowDown');
    await session.press('Enter');

    // Done — no onboarding ran
    await session.waitForText('Onboarding skipped');
    await session.waitForText("What's next?");

    // Docs and dashboard links still appear
    await session.waitForText('Documentation:');
    await session.waitForText('Dashboard:');
    expect(session.snapshot()).toMatchSnapshot('done-skipped');
  });

  it('offers "Continue work with Claude Code" since plugin was installed', async () => {
    using session = createSession();

    await navigateToOnboarding(session);

    await session.press('ArrowDown');
    await session.press('Enter');

    await session.waitForText('Continue work with Claude Code');
    expect(session.snapshot()).toMatchSnapshot('done-skipped-with-ide');
  });
});
