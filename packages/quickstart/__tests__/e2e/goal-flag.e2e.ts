import { createSession, navigatePastWelcome, navigatePastAuth } from './testing-framework/index.js';

describe('--features flag', () => {
  it('skips feature selection screen when --features is provided', async () => {
    using session = createSession({ extraArgs: ['--features', 'flags'] });

    await navigatePastWelcome(session);
    await navigatePastAuth(session);

    // Should skip SelectGoal and land on InstallPlugins
    await session.waitForText('Which CLI agent would you like to use?');
  });

  it('accepts multiple features', async () => {
    using session = createSession({
      extraArgs: ['--features', 'flags', '--features', 'events'],
    });

    await navigatePastWelcome(session);
    await navigatePastAuth(session);

    // Should skip SelectGoal and land on InstallPlugins
    await session.waitForText('Which CLI agent would you like to use?');
  });
});
