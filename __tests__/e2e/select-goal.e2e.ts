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
    await session.waitForText('YOLO');
    await session.waitForText('Skip setup');
    expect(session.snapshot()).toMatchSnapshot('select-goal');
  });

  it('shows feature flag steps after selecting Feature Flags', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);
    session.checkpoint();
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
    await session.press('Enter');

    await session.waitForText('Start onboarding?');
    expect(session.snapshot()).toContain('add the Confidence SDK');
    expect(session.snapshot()).toContain('set up session recordings');
  });

  it('shows event tracking steps after selecting Event Tracking', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);
    session.checkpoint();

    // Event Tracking — 2nd option
    await session.press('ArrowDown');
    await session.press('Enter');

    await session.waitForText('Start onboarding?');
    expect(session.snapshot()).toContain('add the Confidence SDK');
    expect(session.snapshot()).toContain('instrument event tracking');
  });

  it('shows combined steps after selecting YOLO', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);
    session.checkpoint();

    // YOLO — 4th option
    await session.pressRepeat('ArrowDown', 3);
    await session.press('Enter');

    await session.waitForText('Start onboarding?');
    expect(session.snapshot()).toContain('set up feature flags');
    expect(session.snapshot()).toContain('set up session recordings');
    expect(session.snapshot()).toContain('instrument event tracking');
  });

  it('advances to Done when skip is selected', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);

    // Skip setup — 5th option
    await session.pressRepeat('ArrowDown', 4);
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
    await session.waitForText('Skip setup');
  });
});
