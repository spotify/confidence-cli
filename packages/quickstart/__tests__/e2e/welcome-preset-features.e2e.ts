import { createSession } from '@spotify-confidence/testing/e2e';

describe('welcome screen with preset features', () => {
  it('shows tailored tagline for single preset feature', async () => {
    using session = createSession({ extraArgs: ['--features', 'flags'] });

    await session.waitForText('Feature flags, set up with AI in minutes');
    await session.waitForText('Start setup');
    expect(session.snapshot()).toMatchSnapshot('welcome-preset-flags');
  });

  it('shows tailored tagline for multiple preset features', async () => {
    using session = createSession({
      extraArgs: ['--features', 'flags', '--features', 'events'],
    });

    await session.waitForText('Feature flags and event tracking, set up with AI in minutes');
    await session.waitForText('Start setup');
    expect(session.snapshot()).toMatchSnapshot('welcome-preset-flags-events');
  });

  it('shows tailored intro for preset features', async () => {
    using session = createSession({ extraArgs: ['--features', 'events'] });

    await session.waitForText('set up event tracking in your project');
    await session.waitForText('Start setup');
    expect(session.snapshot()).toMatchSnapshot('welcome-preset-events');
  });

  it('shows tailored step 5 for non-flag preset', async () => {
    using session = createSession({ extraArgs: ['--features', 'events'] });

    await session.waitForText('Set up event tracking in your project');
  });

  it('preserves default step 5 for flags-only preset', async () => {
    using session = createSession({ extraArgs: ['--features', 'flags'] });

    await session.waitForText('Show a working feature flag example');
  });

  it('shows incompatibility notice when recordings preset on non-browser framework', async () => {
    using session = createSession({
      project: 'python-statsig',
      extraArgs: ['--features', 'recordings'],
    });

    await session.waitForText('Recordings not supported');
    await session.waitForText('Change framework');
    expect(session.snapshot()).not.toContain('Start setup');
    expect(session.snapshot()).toMatchSnapshot('welcome-preset-recordings-incompatible');
  });
});
