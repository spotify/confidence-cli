import { createSession } from './testing-framework/index.js';
import { IS_WINDOWS } from './testing-framework/env.js';
import { dirname } from 'node:path';

describe('when system check fails', () => {
  it('shows error when git is missing', async () => {
    // PATH with node but no git
    using session = createSession({ systemPath: dirname(process.execPath) });

    // Welcome
    await session.waitForText('Start setup');
    await session.press('Enter');

    // SystemCheck — git not found
    await session.waitForText('System Check');
    await session.waitForText('Some required tools are missing');
    await session.waitForText('Retry');
    await session.waitForText('Quit');
    expect(session.snapshot()).toMatchSnapshot('system-check-failure');
  });

  /**
   * @todo Make this test work on Windows. It currently relies on `/usr/bin`
   * as a PATH that contains git but not node, which has no direct Windows
   * equivalent. Constructing one portably is non-trivial because git's
   * install location varies across Windows setups.
   */
  it.skipIf(IS_WINDOWS)('shows error when node is not on PATH', async () => {
    using session = createSession({ systemPath: '/usr/bin' });

    await session.waitForText('Start setup');
    await session.press('Enter');

    // SystemCheck — node not found on PATH
    await session.waitForText('System Check');
    await session.waitForText('Some required tools are missing');
    expect(session.snapshot()).toMatchSnapshot('system-check-node-missing');
  });

  it('exits with code 1 when user selects Quit', async () => {
    using session = createSession({ systemPath: dirname(process.execPath) });

    await session.waitForText('Start setup');
    await session.press('Enter');

    // SystemCheck — select Quit (2nd option)
    await session.waitForText('Required tools are missing');
    await session.press('ArrowDown');
    await session.press('Enter');

    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(1);
  });
});
