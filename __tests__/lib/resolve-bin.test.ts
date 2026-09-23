import { join } from 'node:path';
import { resolveBin } from '@lib/resolve-bin.js';

describe('resolveBin', () => {
  it('returns the command unchanged on Unix even when a .js shim exists', () => {
    const sut = resolveBin('claude', ['--version'], {
      platform: 'darwin',
      pathEnv: '/mock/bin',
      exists: () => true,
    });

    expect(sut).toEqual({ command: 'claude', args: ['--version'] });
  });

  it('runs a PATH .js shim with node on Windows', () => {
    const binDir = '/mock/bin';
    const jsPath = join(binDir, 'claude.js');

    const sut = resolveBin('claude', ['--version'], {
      platform: 'win32',
      pathEnv: binDir,
      execPath: '/nodejs/node.exe',
      exists: (path) => path === jsPath,
    });

    expect(sut).toEqual({
      command: '/nodejs/node.exe',
      args: [jsPath, '--version'],
    });
  });

  it('returns the command unchanged on Windows when no .js shim exists', () => {
    const sut = resolveBin('claude', ['--version'], {
      platform: 'win32',
      pathEnv: join('/Windows', 'System32'),
      exists: () => false,
    });

    expect(sut).toEqual({ command: 'claude', args: ['--version'] });
  });
});
