import { updateCommand } from '@commands/update.js';
import { captureOutput } from '../helpers/capture.js';
import { createRunner } from '../helpers/run-command.js';

const mockExecFile = vi.fn<(...args: unknown[]) => Promise<{ stdout: string; stderr: string }>>();
const mockDetectPM = vi.fn<() => string>();

vi.mock('@spotify-confidence/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@spotify-confidence/core')>();
  return { ...actual, execFile: (...args: unknown[]) => mockExecFile(...args) };
});

vi.mock('../../src/features/update/detect-pm.js', () => ({
  detectPackageManager: () => mockDetectPM(),
}));

vi.mock('../../src/meta.js', () => ({
  APP_NAME: 'confidence',
  CLI_VERSION: '1.0.0',
}));

vi.mock('ora', () => {
  const spinner = {
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  };
  return { default: () => spinner };
});

const run = createRunner(updateCommand);

beforeEach(() => {
  vi.clearAllMocks();
  mockDetectPM.mockReturnValue('npm');
});

function registryReturns(version: string) {
  mockExecFile.mockResolvedValueOnce({ stdout: `${version}\n`, stderr: '' });
}

function registryFails() {
  mockExecFile.mockRejectedValueOnce(new Error('npm ERR! network'));
}

describe('update', () => {
  it('reports up to date when versions match', async () => {
    using output = captureOutput();
    registryReturns('1.0.0');

    await run(['update']);

    expect(output.stderr).toBe('');
    expect(mockExecFile).toHaveBeenCalledTimes(1);
    expect(mockExecFile).toHaveBeenCalledWith('npm', [
      'view',
      '@spotify-confidence/cli',
      'version',
    ]);
  });

  it('runs the install command for the detected package manager', async () => {
    using _output = captureOutput();
    registryReturns('2.0.0');
    mockDetectPM.mockReturnValue('npm');
    mockExecFile.mockResolvedValueOnce({ stdout: '', stderr: '' });

    await run(['update']);

    expect(mockExecFile).toHaveBeenCalledWith('npm', [
      'install',
      '-g',
      '@spotify-confidence/cli@latest',
    ]);
  });

  it('advises npx users to run the latest version manually', async () => {
    using output = captureOutput();
    registryReturns('2.0.0');
    mockDetectPM.mockReturnValue('npx');

    await run(['update']);

    expect(output.stdout).toContain('npx');
    expect(output.stdout).toContain('@latest');
    expect(mockExecFile).toHaveBeenCalledTimes(1);
  });

  it('reports a friendly error when the registry is unreachable', async () => {
    using output = captureOutput();
    registryFails();

    await run(['update']);

    expect(output.stderr).toContain('npm registry');
  });

  it('advises Yarn Berry users to reinstall with npm', async () => {
    using output = captureOutput();
    registryReturns('2.0.0');
    mockDetectPM.mockReturnValue('yarn');
    mockExecFile.mockResolvedValueOnce({ stdout: '4.1.0\n', stderr: '' });

    await run(['update']);

    expect(output.stdout).toContain('Yarn Berry');
    expect(output.stdout).toContain('npm install -g');
    expect(mockExecFile).toHaveBeenCalledTimes(2);
  });

  it('runs yarn global add for Yarn Classic', async () => {
    using _output = captureOutput();
    registryReturns('2.0.0');
    mockDetectPM.mockReturnValue('yarn');
    mockExecFile.mockResolvedValueOnce({ stdout: '1.22.19\n', stderr: '' });
    mockExecFile.mockResolvedValueOnce({ stdout: '', stderr: '' });

    await run(['update']);

    expect(mockExecFile).toHaveBeenCalledWith('yarn', [
      'global',
      'add',
      '@spotify-confidence/cli@latest',
    ]);
  });

  it('reports permission errors with a sudo hint', async () => {
    using output = captureOutput();
    registryReturns('2.0.0');
    mockExecFile.mockRejectedValueOnce(new Error('EACCES: permission denied'));

    await run(['update']);

    expect(output.stderr).toContain('sudo');
  });

  it('checks version via npm view', async () => {
    using _output = captureOutput();
    registryReturns('1.0.0');

    await run(['update']);

    expect(mockExecFile).toHaveBeenCalledWith('npm', [
      'view',
      '@spotify-confidence/cli',
      'version',
    ]);
  });
});
