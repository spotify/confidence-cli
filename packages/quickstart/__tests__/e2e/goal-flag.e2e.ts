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
    it('shows error when recordings are pre-set with a non-browser SDK', async () => {
      using session = createSession({
        project: 'python-statsig',
        extraArgs: ['--features', 'recordings'],
      });

      await navigatePastWelcome(session);

      await session.waitForText('Incompatible feature selection');
      await session.waitForText('Session recordings are not available');
      await session.waitForText('Quit');
    });

    it('offers continue option when other goals are also pre-set', async () => {
      using session = createSession({
        project: 'python-statsig',
        extraArgs: ['--features', 'flags', '--features', 'recordings'],
      });

      await navigatePastWelcome(session);

      await session.waitForText('Incompatible feature selection');
      await session.waitForText('Continue without recordings');
    });

    it('advances with remaining goals after choosing continue', async () => {
      using session = createSession({
        project: 'python-statsig',
        extraArgs: ['--features', 'flags', '--features', 'recordings'],
      });

      await navigatePastWelcome(session);

      await session.waitForText('Continue without recordings');
      await session.press('Enter');

      // Advances to Authenticate after goal resolution
      await navigatePastAuth(session);
      await session.waitForText('Which CLI agent would you like to use?');
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
