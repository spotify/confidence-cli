import { createSession, ENTER } from './helpers/index.js';

describe('when the project is empty', () => {
  it('shows "Select framework" instead of "Start setup" on the Welcome screen', async () => {
    using session = createSession({ project: 'empty' });

    await session.waitForText('Confidence Quickstart');
    await session.waitForText('Could not auto-detect');
    await session.waitForText('Please, select your framework');
    await session.waitForText('Select framework');
    expect(session.snapshot()).toMatchSnapshot('welcome-no-framework');
  });

  it('shows "Start setup" after selecting a framework', async () => {
    using session = createSession({ project: 'empty' });

    // Welcome — no framework detected
    await session.waitForText('Select framework');
    await session.sendKey(ENTER);

    // SelectFramework
    await session.waitForText('Select Framework');
    await session.waitForText("Select your project's framework or language:");
    await session.sendKey(ENTER);

    // Back to Welcome — now with framework set
    await session.waitForText('Start setup');
    await session.waitForText('Ready to get started?');
    expect(session.snapshot()).toMatchSnapshot('welcome-after-framework-selected');
  });
});
