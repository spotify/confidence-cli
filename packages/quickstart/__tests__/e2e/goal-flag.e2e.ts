import {
  createSession,
  navigatePastWelcome,
  navigatePastAuth,
} from '@spotify-confidence/testing/e2e';

describe('--features flag', () => {
  it('skips feature selection screen when --features is provided', async () => {
    using session = createSession({ extraArgs: ['--features', 'flags'] });

    await navigatePastWelcome(session);
    // SelectGoal auto-advances because goals are preset
    await navigatePastAuth(session);

    // Should land on InstallPlugins
    await session.waitForText('Which CLI agent would you like to use?');
  });

  it('omits "Select features" from the task list when --features is provided', async () => {
    using session = createSession({ extraArgs: ['--features', 'flags'] });

    await navigatePastWelcome(session);
    await navigatePastAuth(session);
    await session.waitForText('Which CLI agent would you like to use?');

    const frame = session.screen;
    expect(frame).not.toContain('Select features');
    expect(frame).toContain('Check system');
    expect(frame).toContain('Log in to Confidence');
    expect(frame).toContain('Set up your agent');
    expect(session.snapshot()).toMatchSnapshot('task-list-without-select-features');
  });

  it('accepts multiple features', async () => {
    using session = createSession({
      extraArgs: ['--features', 'flags', '--features', 'events'],
    });

    await navigatePastWelcome(session);
    // SelectGoal auto-advances because goals are preset
    await navigatePastAuth(session);

    // Should land on InstallPlugins
    await session.waitForText('Which CLI agent would you like to use?');
  });

  describe('incompatible recordings preset', () => {
    it('blocks start when recordings and other goals are pre-set on non-browser SDK', async () => {
      using session = createSession({
        project: 'python-statsig',
        extraArgs: ['--features', 'flags', '--features', 'recordings'],
      });

      await session.waitForText('Recordings not supported');
      await session.waitForText('Change framework');
      expect(session.screen).not.toContain('Start setup');
    });

    it('advances after changing to a compatible framework', async () => {
      using session = createSession({
        project: 'python-statsig',
        extraArgs: ['--features', 'flags', '--features', 'recordings'],
      });

      await session.waitForText('Change framework');
      await session.press('Enter');

      // SelectFramework — pick React (first option, browser SDK)
      await session.waitForText('Select Framework');
      await session.press('Enter');

      // Back to Welcome — now compatible, Start setup appears
      await session.waitForText('Start setup');
    });

    it('skips goal screen when recordings are pre-set with a browser SDK', async () => {
      using session = createSession({
        extraArgs: ['--features', 'flags', '--features', 'recordings'],
      });

      await navigatePastWelcome(session);
      // Browser SDK (react) — should auto-advance past SelectGoal
      await navigatePastAuth(session);
      await session.waitForText('Which CLI agent would you like to use?');
    });
  });
});
