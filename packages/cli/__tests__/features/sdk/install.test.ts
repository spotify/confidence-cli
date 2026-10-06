import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { FrameworkConfig } from '@spotify-confidence/core';
import { runSdkInstall } from '@features/sdk/install.js';

const mockExecFile = vi.fn<() => Promise<void>>();
const mockDetectFramework = vi.fn<() => Promise<FrameworkConfig | null>>();
const mockMessage = vi.fn();

vi.mock('ora', () => ({
  default: () => ({ start: () => ({ succeed: vi.fn(), fail: vi.fn() }) }),
}));

vi.mock('@spotify-confidence/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@spotify-confidence/core')>();
  return {
    ...actual,
    detectFramework: (...args: unknown[]) => mockDetectFramework(...(args as [])),
    execFile: (...args: unknown[]) => mockExecFile(...(args as [])),
  };
});

vi.mock('@output/print.js', () => ({
  message: (...args: unknown[]) => mockMessage(...args),
  fail: vi.fn(),
}));

const REACT_FRAMEWORK: FrameworkConfig = {
  id: 'react',
  name: 'React',
  docsUrl: 'https://confidence.spotify.com/docs/sdk/react',
  sdkPackage: '@spotify-confidence/sdk',
  detect: async () => true,
};

const PYTHON_FRAMEWORK: FrameworkConfig = {
  id: 'python',
  name: 'Python',
  docsUrl: 'https://confidence.spotify.com/docs/sdk/python',
  sdkPackage: 'spotify-confidence-sdk',
  detect: async () => true,
};

const tmpDir = join(process.env.TMPDIR ?? '/tmp', 'sdk-install-test');

beforeEach(() => {
  mkdirSync(tmpDir, { recursive: true });
  mockExecFile.mockResolvedValue(undefined);
  mockDetectFramework.mockResolvedValue(REACT_FRAMEWORK);
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  mockExecFile.mockReset();
  mockDetectFramework.mockReset();
  mockMessage.mockReset();
});

describe('runSdkInstall workspace root handling', () => {
  it('passes -w when pnpm-workspace.yaml is present', async () => {
    writeFileSync(join(tmpDir, 'pnpm-lock.yaml'), '');
    writeFileSync(join(tmpDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*');

    await runSdkInstall({ dir: tmpDir });

    expect(mockExecFile).toHaveBeenCalledWith(
      'pnpm',
      ['add', '-w', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it('omits -w for pnpm without workspace config', async () => {
    writeFileSync(join(tmpDir, 'pnpm-lock.yaml'), '');

    await runSdkInstall({ dir: tmpDir });

    expect(mockExecFile).toHaveBeenCalledWith(
      'pnpm',
      ['add', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it('passes -W for yarn classic with workspaces', async () => {
    writeFileSync(join(tmpDir, 'yarn.lock'), '');
    writeFileSync(join(tmpDir, 'package.json'), JSON.stringify({ workspaces: ['packages/*'] }));

    await runSdkInstall({ dir: tmpDir });

    expect(mockExecFile).toHaveBeenCalledWith(
      'yarn',
      ['add', '-W', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it('omits -W for yarn berry with workspaces', async () => {
    writeFileSync(join(tmpDir, 'yarn.lock'), '');
    writeFileSync(join(tmpDir, 'package.json'), JSON.stringify({ workspaces: ['packages/*'] }));
    writeFileSync(join(tmpDir, '.yarnrc.yml'), 'nodeLinker: node-modules');

    await runSdkInstall({ dir: tmpDir });

    expect(mockExecFile).toHaveBeenCalledWith(
      'yarn',
      ['add', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it('omits -W for yarn without workspaces', async () => {
    writeFileSync(join(tmpDir, 'yarn.lock'), '');

    await runSdkInstall({ dir: tmpDir });

    expect(mockExecFile).toHaveBeenCalledWith(
      'yarn',
      ['add', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it('does not add flags for npm at a workspace root', async () => {
    writeFileSync(join(tmpDir, 'package.json'), JSON.stringify({ workspaces: ['packages/*'] }));

    await runSdkInstall({ dir: tmpDir });

    expect(mockExecFile).toHaveBeenCalledWith(
      'npm',
      ['add', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it('does not add flags for bun at a workspace root', async () => {
    writeFileSync(join(tmpDir, 'bun.lockb'), '');
    writeFileSync(join(tmpDir, 'package.json'), JSON.stringify({ workspaces: ['packages/*'] }));

    await runSdkInstall({ dir: tmpDir });

    expect(mockExecFile).toHaveBeenCalledWith(
      'bun',
      ['add', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });
});

describe('runSdkInstall Python package manager detection', () => {
  beforeEach(() => {
    mockDetectFramework.mockResolvedValue(PYTHON_FRAMEWORK);
  });

  it('uses poetry add when poetry.lock is present', async () => {
    writeFileSync(join(tmpDir, 'poetry.lock'), '');

    await runSdkInstall({ dir: tmpDir });

    expect(mockExecFile).toHaveBeenCalledWith(
      'poetry',
      ['add', 'spotify-confidence-sdk'],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it('uses uv add when uv.lock is present', async () => {
    writeFileSync(join(tmpDir, 'uv.lock'), '');

    await runSdkInstall({ dir: tmpDir });

    expect(mockExecFile).toHaveBeenCalledWith(
      'uv',
      ['add', 'spotify-confidence-sdk'],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it('uses pipenv install when Pipfile is present', async () => {
    writeFileSync(join(tmpDir, 'Pipfile'), '');

    await runSdkInstall({ dir: tmpDir });

    expect(mockExecFile).toHaveBeenCalledWith(
      'pipenv',
      ['install', 'spotify-confidence-sdk'],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it('falls back to manual install when no Python PM is detected', async () => {
    await runSdkInstall({ dir: tmpDir });

    expect(mockExecFile).not.toHaveBeenCalled();
    expect(mockMessage).toHaveBeenCalledWith(expect.stringContaining('pip install'));
  });
});
