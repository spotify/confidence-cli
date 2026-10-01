import { createSession } from './testing-framework/index.js';

describe('welcome screen navigation', () => {
  it('navigates to About screen', async () => {
    using session = createSession();

    await session.waitForText('Confidence Quickstart');
    await session.waitForText('Start setup');

    await session.pressRepeat('ArrowDown', 2);
    await session.press('Enter');

    await session.waitForText('About Confidence');
    expect(session.snapshot()).toMatchSnapshot('about');
  });

  it('navigates to SelectFramework screen', async () => {
    using session = createSession();

    await session.waitForText('Confidence Quickstart');
    await session.waitForText('Start setup');

    await session.press('ArrowDown');
    await session.press('Enter');

    await session.waitForText('Select Framework');
    expect(session.snapshot()).toMatchSnapshot('select-framework');
  });

  it('exits cleanly on Quit', async () => {
    using session = createSession();

    await session.waitForText('Confidence Quickstart');
    await session.waitForText('Start setup');

    await session.pressRepeat('ArrowDown', 3);
    await session.press('Enter');
    expect(session.snapshot()).toMatchSnapshot('welcome-quit-selected');

    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(0);
  });
});
