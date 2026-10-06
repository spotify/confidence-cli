import { resolve } from 'node:path';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { pluginCommand } from '@commands/plugin.js';
import { captureOutput } from '../helpers/capture.js';
import { createMockIntegration } from '../helpers/mock-integration.js';
import { createRunner } from '../helpers/run-command.js';

const mockIntegration = createMockIntegration();

const mockInstallPlugin = vi.fn().mockResolvedValue('cli');
const mockUpdatePlugin = vi.fn().mockResolvedValue('cli');
const mockUninstallPlugin = vi.fn().mockResolvedValue(undefined);

vi.mock('@spotify-confidence/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@spotify-confidence/core')>();
  return {
    ...actual,
    getIntegration: () => mockIntegration,
    getIntegrations: () => [mockIntegration],
    installPlugin: (...args: unknown[]) => mockInstallPlugin(...args),
    updatePlugin: (...args: unknown[]) => mockUpdatePlugin(...args),
    uninstallPlugin: (...args: unknown[]) => mockUninstallPlugin(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

const run = createRunner(pluginCommand);

describe('plugin install', () => {
  it('installs the plugin for the specified IDE', async () => {
    using _auth = prepareAuthTokens('none');
    using _output = captureOutput();

    await run(['plugin', 'install', '--ide', 'claude']);

    expect(mockInstallPlugin).toHaveBeenCalledWith('claude', process.cwd());
  });

  it('passes --dir as project directory', async () => {
    using _auth = prepareAuthTokens('none');
    using _output = captureOutput();

    await run(['plugin', 'install', '--ide', 'claude', '--dir', 'some/relative/path']);

    expect(mockInstallPlugin).toHaveBeenCalledWith('claude', resolve('some/relative/path'));
  });

  it('reports failure to stderr', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    mockInstallPlugin.mockRejectedValueOnce(new Error('install failed'));

    await run(['plugin', 'install', '--ide', 'claude']);

    expect(output.stderr).toContain('install failed');
  });
});

describe('plugin update', () => {
  it('updates the plugin for the specified IDE', async () => {
    using _auth = prepareAuthTokens('none');
    using _output = captureOutput();

    await run(['plugin', 'update', '--ide', 'claude']);

    expect(mockUpdatePlugin).toHaveBeenCalledWith('claude', process.cwd());
  });

  it('passes --dir as project directory', async () => {
    using _auth = prepareAuthTokens('none');
    using _output = captureOutput();

    await run(['plugin', 'update', '--ide', 'claude', '--dir', '/tmp/my-project']);

    expect(mockUpdatePlugin).toHaveBeenCalledWith('claude', '/tmp/my-project');
  });

  it('reports failure to stderr', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    mockUpdatePlugin.mockRejectedValueOnce(new Error('update failed'));

    await run(['plugin', 'update', '--ide', 'claude']);

    expect(output.stderr).toContain('update failed');
  });
});

describe('plugin uninstall', () => {
  it('uninstalls the plugin for the specified IDE', async () => {
    using _auth = prepareAuthTokens('none');
    using _output = captureOutput();

    await run(['plugin', 'uninstall', '--ide', 'claude']);

    expect(mockUninstallPlugin).toHaveBeenCalledWith('claude', process.cwd());
  });

  it('passes --dir as project directory', async () => {
    using _auth = prepareAuthTokens('none');
    using _output = captureOutput();

    await run(['plugin', 'uninstall', '--ide', 'claude', '--dir', '/tmp/my-project']);

    expect(mockUninstallPlugin).toHaveBeenCalledWith('claude', '/tmp/my-project');
  });

  it('reports failure to stderr', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    mockUninstallPlugin.mockRejectedValueOnce(new Error('uninstall failed'));

    await run(['plugin', 'uninstall', '--ide', 'claude']);

    expect(output.stderr).toContain('uninstall failed');
  });
});
