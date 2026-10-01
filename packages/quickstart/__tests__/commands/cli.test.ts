import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

describe('when opting out of telemetry from the CLI', () => {
  it.each([
    ['help', '--no-telemetry'],
    ['--no-telemetry', 'help'],
  ])('accepts %j %j without an argument error', async (...args) => {
    const sut = await run(process.execPath, ['--import', 'tsx', 'bin/cli.ts', ...args], {
      cwd: projectRoot,
    });

    expect(sut.stdout).toContain('Usage:');
    expect(sut.stderr).not.toContain('Unknown argument');
  });
});
