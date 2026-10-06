import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FrameworkConfig } from '@spotify-confidence/core';
import { createProjectDir } from '@spotify-confidence/testing/scaffold';
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

beforeEach(() => {
  mockExecFile.mockResolvedValue(undefined);
  mockDetectFramework.mockResolvedValue(REACT_FRAMEWORK);
});

describe('runSdkInstall workspace root handling', () => {
  it('passes -w when pnpm-workspace.yaml is present', async () => {
    using project = createProjectDir('empty');
    writeFileSync(join(project.path, 'pnpm-lock.yaml'), '');
    writeFileSync(join(project.path, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*');

    await runSdkInstall({ dir: project.path });

    expect(mockExecFile).toHaveBeenCalledWith(
      'pnpm',
      ['add', '-w', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: project.path }),
    );
  });

  it('omits -w for pnpm without workspace config', async () => {
    using project = createProjectDir('empty');
    writeFileSync(join(project.path, 'pnpm-lock.yaml'), '');

    await runSdkInstall({ dir: project.path });

    expect(mockExecFile).toHaveBeenCalledWith(
      'pnpm',
      ['add', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: project.path }),
    );
  });

  it('passes -W for yarn classic with workspaces', async () => {
    using project = createProjectDir('empty');
    writeFileSync(join(project.path, 'yarn.lock'), '');
    writeFileSync(
      join(project.path, 'package.json'),
      JSON.stringify({ workspaces: ['packages/*'] }),
    );

    await runSdkInstall({ dir: project.path });

    expect(mockExecFile).toHaveBeenCalledWith(
      'yarn',
      ['add', '-W', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: project.path }),
    );
  });

  it('omits -W for yarn berry with workspaces', async () => {
    using project = createProjectDir('empty');
    writeFileSync(join(project.path, 'yarn.lock'), '');
    writeFileSync(
      join(project.path, 'package.json'),
      JSON.stringify({ workspaces: ['packages/*'] }),
    );
    writeFileSync(join(project.path, '.yarnrc.yml'), 'nodeLinker: node-modules');

    await runSdkInstall({ dir: project.path });

    expect(mockExecFile).toHaveBeenCalledWith(
      'yarn',
      ['add', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: project.path }),
    );
  });

  it('omits -W for yarn without workspaces', async () => {
    using project = createProjectDir('empty');
    writeFileSync(join(project.path, 'yarn.lock'), '');

    await runSdkInstall({ dir: project.path });

    expect(mockExecFile).toHaveBeenCalledWith(
      'yarn',
      ['add', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: project.path }),
    );
  });

  it('does not add flags for npm at a workspace root', async () => {
    using project = createProjectDir('empty');
    writeFileSync(
      join(project.path, 'package.json'),
      JSON.stringify({ workspaces: ['packages/*'] }),
    );

    await runSdkInstall({ dir: project.path });

    expect(mockExecFile).toHaveBeenCalledWith(
      'npm',
      ['add', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: project.path }),
    );
  });

  it('does not add flags for bun at a workspace root', async () => {
    using project = createProjectDir('empty');
    writeFileSync(join(project.path, 'bun.lockb'), '');
    writeFileSync(
      join(project.path, 'package.json'),
      JSON.stringify({ workspaces: ['packages/*'] }),
    );

    await runSdkInstall({ dir: project.path });

    expect(mockExecFile).toHaveBeenCalledWith(
      'bun',
      ['add', '@spotify-confidence/sdk'],
      expect.objectContaining({ cwd: project.path }),
    );
  });
});

describe('runSdkInstall Python package manager detection', () => {
  beforeEach(() => {
    mockDetectFramework.mockResolvedValue(PYTHON_FRAMEWORK);
  });

  it('uses poetry add when poetry.lock is present', async () => {
    using project = createProjectDir('empty');
    writeFileSync(join(project.path, 'poetry.lock'), '');

    await runSdkInstall({ dir: project.path });

    expect(mockExecFile).toHaveBeenCalledWith(
      'poetry',
      ['add', 'spotify-confidence-sdk'],
      expect.objectContaining({ cwd: project.path }),
    );
  });

  it('uses uv add when uv.lock is present', async () => {
    using project = createProjectDir('empty');
    writeFileSync(join(project.path, 'uv.lock'), '');

    await runSdkInstall({ dir: project.path });

    expect(mockExecFile).toHaveBeenCalledWith(
      'uv',
      ['add', 'spotify-confidence-sdk'],
      expect.objectContaining({ cwd: project.path }),
    );
  });

  it('uses pipenv install when Pipfile is present', async () => {
    using project = createProjectDir('empty');
    writeFileSync(join(project.path, 'Pipfile'), '');

    await runSdkInstall({ dir: project.path });

    expect(mockExecFile).toHaveBeenCalledWith(
      'pipenv',
      ['install', 'spotify-confidence-sdk'],
      expect.objectContaining({ cwd: project.path }),
    );
  });

  it('falls back to manual install when no Python PM is detected', async () => {
    using project = createProjectDir('empty');

    await runSdkInstall({ dir: project.path });

    expect(mockExecFile).not.toHaveBeenCalled();
    expect(mockMessage).toHaveBeenCalledWith(expect.stringContaining('pip install'));
  });
});
