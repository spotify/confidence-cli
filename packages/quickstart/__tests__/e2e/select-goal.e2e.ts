import { createSession, navigateToGoalSelection } from './testing-framework/index.js';

describe('SelectGoal screen', () => {
  it('shows goal options for a browser framework', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);

    await session.waitForText('Flags');
    await session.waitForText('Recordings');
    await session.waitForText('Events');
    await session.waitForText('space');
    await session.waitForText('toggle');
    expect(session.snapshot()).toMatchSnapshot('select-goal');
  });

  it('advances to InstallPlugins after selecting a goal', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);
    session.checkpoint();
    await session.press('Space');
    await session.press('Enter');

    await session.waitForText('Which CLI agent would you like to use?');
  });

  it('shows validation message when submitting with nothing selected', async () => {
    using session = createSession();

    await navigateToGoalSelection(session);
    await session.press('Enter');

    await session.waitForText('Please toggle at least one option to continue.');
    await session.waitForText('Toggle features to set up');
  });

  it('shows goal selection for non-browser project without recording option', async () => {
    using session = createSession({ project: 'statsig-node' });

    await navigateToGoalSelection(session);

    await session.waitForText('Flags');
    await session.waitForText('Events');
  });
});
