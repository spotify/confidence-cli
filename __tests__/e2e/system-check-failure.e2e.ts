import { TerminalSession, ENTER, ARROW_DOWN } from './helpers/index.js';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';

// The CLI is spawned via process.execPath (absolute node path), so it runs
// regardless of PATH. But the system check uses execFile('node'/'git'), which
// resolves from PATH — so stripping a binary from PATH makes that check fail.
function createSessionWithPath(customPath: string): TerminalSession {
  const mockBinDir = process.env.E2E_MOCK_BIN_DIR!;
  const projectDir = mkdtempSync(join(tmpdir(), 'e2e-project-'));
  writeFileSync(
    join(projectDir, 'package.json'),
    JSON.stringify({ dependencies: { react: '^19.0.0' } }),
  );

  return new TerminalSession({
    args: ['--debug', '--dir', projectDir],
    env: { PATH: `${mockBinDir}:${customPath}` },
    cwd: projectDir,
  });
}

describe('when system check fails', () => {
  it('shows error when git is missing', async () => {
    // PATH with node but no git
    using session = createSessionWithPath(dirname(process.execPath));

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
    using session = createSessionWithPath('/usr/bin');

    await session.waitForText('Start setup');
    await session.sendKey(ENTER);

    // SystemCheck — node not found on PATH
    await session.waitForText('System Check');
    await session.waitForText('Some required tools are missing');
  });

  it('exits with code 1 when user selects Quit', async () => {
    using session = createSessionWithPath(dirname(process.execPath));

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
