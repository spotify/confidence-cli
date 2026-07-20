import { createSession, navigateToOnboarding, ARROW_DOWN, ENTER } from './helpers/index.js';

describe('when the user skips onboarding', () => {
  it('shows Done screen without report file or code changes', async () => {
    using session = createSession();

    await navigateToOnboarding(session);

    // Select "Skip for now" — 2nd option
    await session.sendKey(ARROW_DOWN);
    await session.sendKey(ENTER);

    // Done — no onboarding ran
    await session.waitForText('Confidence is ready');
    await session.waitForText("What's next?");

    // Docs and dashboard links still appear
    await session.waitForText('Docs:');
    await session.waitForText('Dashboard:');
  });

  it('offers "Continue work with Claude Code" since plugin was installed', async () => {
    using session = createSession();

    await navigateToOnboarding(session);

    await session.sendKey(ARROW_DOWN);
    await session.sendKey(ENTER);

    await session.waitForText('Continue work with Claude Code');
  });
});
