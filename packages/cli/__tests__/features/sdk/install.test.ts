import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { FrameworkConfig } from '@spotify-confidence/core';
import { runSdkInstall } from '@features/sdk/install.js';

const mockExecFile = vi.fn<() => Promise<void>>();

vi.mock('ora', () => ({
  default: () => ({ start: () => ({ succeed: vi.fn(), fail: vi.fn() }) }),
}));

vi.mock('@spotify-confidence/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@spotify-confidence/core')>();
  return {
    ...actual,
    detectFramework: async (_dir: string) => REACT_FRAMEWORK,
    execFile: (...args: unknown[]) => mockExecFile(...(args as [])),
  };
});

vi.mock('@output/print.js', () => ({
  message: vi.fn(),
  fail: vi.fn(),
}));

const REACT_FRAMEWORK: FrameworkConfig = {
  id: 'react',
  name: 'React',
  docsUrl: 'https://confidence.spotify.com/docs/sdk/react',
  sdkPackage: '@spotify-confidence/sdk',
  detect: async () => true,
};

const tmpDir = join(process.env.TMPDIR ?? '/tmp', 'sdk-install-test');

beforeEach(() => {
  mkdirSync(tmpDir, { recursive: true });
  mockExecFile.mockResolvedValue(undefined);
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  mockExecFile.mockReset();
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
