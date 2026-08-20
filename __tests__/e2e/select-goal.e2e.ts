import {
  createSession,
  navigateToGoalSelection,
  navigateToConnectTools,
} from './testing-framework/index.js';

describe('SelectGoal screen', () => {
  it('shows goal options for a browser framework', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);

    await session.waitForText('Feature Flags');
    await session.waitForText('Session Recordings');
    await session.waitForText('Event Tracking');
    await session.waitForText('space');
    await session.waitForText('toggle');
    expect(session.snapshot()).toMatchSnapshot('select-goal');
  });

  it('shows feature flag steps after selecting Feature Flags', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);
    session.checkpoint();
    await session.press('Space');
    await session.press('Enter');

    await session.waitForText('Start onboarding?');
    expect(session.snapshot()).toContain('add the Confidence SDK');
    expect(session.snapshot()).toContain('create your first feature flag');
  });

  it('shows session recording steps after selecting Session Recordings', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);
    session.checkpoint();

    // Session Recordings — 3rd option
    await session.pressRepeat('ArrowDown', 2);
    await session.press('Space');
    await session.press('Enter');

    await session.waitForText('Start onboarding?');
    expect(session.snapshot()).toContain('add the Confidence SDK');
    expect(session.snapshot()).toContain('set up session recordings');
  });

  it('shows combined steps when multiple goals are selected', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);
    session.checkpoint();

    // Toggle Feature Flags (1st), Event Tracking (2nd), Session Recordings (3rd)
    await session.press('Space');
    await session.press('ArrowDown');
    await session.press('Space');
    await session.pressRepeat('ArrowDown', 1);
    await session.press('Space');
    await session.press('Enter');

    await session.waitForText('Start onboarding?');
    expect(session.snapshot()).toContain('create your first feature flag');
    expect(session.snapshot()).toContain('instrument event tracking');
    expect(session.snapshot()).toContain('set up session recordings');
  });

  it('shows event tracking steps after selecting Event Tracking', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);
    session.checkpoint();

    // Event Tracking — 2nd option
    await session.press('ArrowDown');
    await session.press('Space');
    await session.press('Enter');

    await session.waitForText('Start onboarding?');
    expect(session.snapshot()).toContain('add the Confidence SDK');
    expect(session.snapshot()).toContain('instrument event tracking');
  });

  it('advances to Done when submitting with nothing selected', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);
    await session.press('Enter');

    await session.waitForText('Onboarding skipped');
  });

  it('shows goal selection for non-browser project without recording option', async () => {
    using session = createSession({ project: 'statsig-node' });

    await navigateToConnectTools(session);
    session.checkpoint();
    await session.press('Enter');

    // Non-browser project now shows goal selection (without Session Recordings)
    await session.waitForText('Feature Flags');
    await session.waitForText('Event Tracking');
  });
});
