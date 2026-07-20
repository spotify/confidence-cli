import { createSession, ENTER, ARROW_DOWN } from './helpers/index.js';
import { dirname } from 'node:path';

// The CLI is spawned via process.execPath (absolute node path), so it runs
// regardless of PATH. But the system check uses execFile('node'/'git'), which
// resolves from PATH — so stripping a binary from PATH makes that check fail.

describe('when system check fails', () => {
  it('shows error when git is missing', async () => {
    // PATH with node but no git
    using session = createSession({ systemPath: dirname(process.execPath) });

    // Welcome
    await session.waitForText('Start setup');
    await session.sendKey(ENTER);

    // SystemCheck — git not found
    await session.waitForText('System Check');
    await session.waitForText('Some required tools are missing');
    await session.waitForText('Retry');
    await session.waitForText('Quit');
  });

  it('shows error when node is not on PATH', async () => {
    // PATH with git but not node — CLI still runs via absolute path
    using session = createSession({ systemPath: '/usr/bin' });

    await session.waitForText('Start setup');
    await session.sendKey(ENTER);

    // SystemCheck — node not found on PATH
    await session.waitForText('System Check');
    await session.waitForText('Some required tools are missing');
  });

  it('exits with code 1 when user selects Quit', async () => {
    using session = createSession({ systemPath: dirname(process.execPath) });

    await session.waitForText('Start setup');
    await session.sendKey(ENTER);

    // SystemCheck — select Quit (2nd option)
    await session.waitForText('Required tools are missing');
    await session.sendKey(ARROW_DOWN);
    await session.sendKey(ENTER);

    const exitCode = await session.waitForExit();
    expect(exitCode).toBe(1);
  });
});
