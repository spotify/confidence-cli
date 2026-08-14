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
    await session.waitForText('YOLO');
    await session.waitForText('Skip setup');
    expect(session.snapshot()).toMatchSnapshot('select-goal');
  });

  it('advances to OnboardProject after selecting Feature Flags', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);
    await session.press('Enter');

    await session.waitForText('Start onboarding?');
  });

  it('advances to OnboardProject after selecting Session Recordings', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);

    // Session Recordings — 2nd option
    await session.press('ArrowDown');
    await session.press('Enter');

    await session.waitForText('Start onboarding?');
  });

  it('advances to OnboardProject after selecting YOLO', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);

    // YOLO — 3rd option
    await session.pressRepeat('ArrowDown', 2);
    await session.press('Enter');

    await session.waitForText('Start onboarding?');
  });

  it('advances to Done when skip is selected', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);

    // Skip setup — 4th option
    await session.pressRepeat('ArrowDown', 3);
    await session.press('Enter');

    await session.waitForText('Onboarding skipped');
  });

  it('shows migration directly for non-browser project with competitors', async () => {
    using session = createSession({ project: 'statsig-node' });

    await navigateToConnectTools(session);
    session.checkpoint();
    await session.press('Enter');

    // Non-browser project with competitor + plugins → migration sub-phase
    await session.waitForText('Migrate existing flags?');
    await session.waitForText("Integrate and migrate Statsig's flags");
    expect(session.snapshot()).toMatchSnapshot('select-goal-migration');
  });
});
