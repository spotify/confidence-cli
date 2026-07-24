import { createSession, ENTER, ARROW_DOWN } from './helpers/index.js';

describe('welcome screen navigation', () => {
  it('navigates to About screen', async () => {
    using session = createSession();

    await session.waitForText('Confidence Quickstart');
    await session.waitForText('Start setup');

    await session.sendKeyRepeat(ARROW_DOWN, 2);
    await session.sendKey(ENTER);

    await session.waitForText('About Confidence');
    expect(session.snapshot()).toMatchSnapshot('about');
  });

  it('navigates to SelectFramework screen', async () => {
    using session = createSession();

    await session.waitForText('Confidence Quickstart');
    await session.waitForText('Start setup');

    await session.sendKey(ARROW_DOWN);
    await session.sendKey(ENTER);

    await session.waitForText('Select Framework');
    expect(session.snapshot()).toMatchSnapshot('select-framework');
  });

  it('exits cleanly on Quit', async () => {
    using session = createSession();

    await session.waitForText('Confidence Quickstart');
    await session.waitForText('Start setup');

    await session.sendKeyRepeat(ARROW_DOWN, 3);
    await session.sendKey(ENTER);
    expect(session.snapshot()).toMatchSnapshot('welcome-quit-selected');

    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(0);
  });
});
