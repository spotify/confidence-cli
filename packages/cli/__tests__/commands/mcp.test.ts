import { resolve } from 'node:path';
import { buildTestJwt } from '@spotify-confidence/testing/auth';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { mcpCommand } from '@commands/mcp.js';
import { captureOutput } from '../helpers/capture.js';
import { createMockIntegration } from '../helpers/mock-integration.js';
import { createRunner } from '../helpers/run-command.js';

const mockIntegration = createMockIntegration({
  detectMcpStatuses: vi.fn().mockResolvedValue({
    'confidence-flags': 'connected',
    'confidence-docs': 'connected',
  }),
});

const mockAuthenticate = vi.fn().mockResolvedValue({
  accessToken: buildTestJwt({ email: 'test@example.com' }),
  region: 'EU',
});

vi.mock('@spotify-confidence/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@spotify-confidence/core')>();
  return {
    ...actual,
    getIntegration: () => mockIntegration,
    getIntegrations: () => [mockIntegration],
    authenticate: (...args: unknown[]) => mockAuthenticate(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

const run = createRunner(mcpCommand);

describe('mcp list', () => {
  it('outputs available servers as JSON', async () => {
    using output = captureOutput();

    await run(['mcp', 'list', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'confidence-flags' }),
        expect.objectContaining({ name: 'confidence-docs' }),
      ]),
    );
  });

  it('outputs available servers as a table', async () => {
    using output = captureOutput();

    await run(['mcp', 'list', '--output', 'table']);

    expect(output.stdout).toContain('confidence-flags');
    expect(output.stdout).toContain('confidence-docs');
    expect(output.stdout).toContain('Server');
  });
});

describe('mcp status', () => {
  it('outputs server statuses as JSON', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['mcp', 'status', '--ide', 'claude', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ server: 'confidence-flags', status: 'Connected' }),
        expect.objectContaining({ server: 'confidence-docs', status: 'Connected' }),
      ]),
    );
  });
});

describe('mcp install', () => {
  it('connects all MCP servers', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();

    await run(['mcp', 'install', '--ide', 'claude']);

    expect(mockIntegration.connectMcpServer).toHaveBeenCalledTimes(2);
    expect(mockIntegration.connectMcpServer).toHaveBeenCalledWith(
      expect.objectContaining({ serverName: 'confidence-flags' }),
    );
    expect(mockIntegration.connectMcpServer).toHaveBeenCalledWith(
      expect.objectContaining({ serverName: 'confidence-docs' }),
    );
  });

  it('reports failure to stderr when a connection fails', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    vi.mocked(mockIntegration.connectMcpServer).mockRejectedValueOnce(
      new Error('connection refused'),
    );

    await run(['mcp', 'install', '--ide', 'claude']);

    expect(output.stderr).toContain('connection refused');
  });

  it('continues installing remaining servers after a failure', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    vi.mocked(mockIntegration.connectMcpServer).mockRejectedValueOnce(
      new Error('connection refused'),
    );

    await run(['mcp', 'install', '--ide', 'claude']);

    expect(mockIntegration.connectMcpServer).toHaveBeenCalledTimes(2);
  });
});

describe('mcp uninstall', () => {
  it('disconnects all MCP servers', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();

    await run(['mcp', 'uninstall', '--ide', 'claude']);

    expect(mockIntegration.disconnectMcpServer).toHaveBeenCalledTimes(2);
  });
});

describe('mcp auth', () => {
  it('re-authenticates and reconnects all servers', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();

    await run(['mcp', 'auth', '--ide', 'claude']);

    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockIntegration.connectMcpServer).toHaveBeenCalledTimes(2);
  });
});

describe('--profile', () => {
  it('forwards profile to authenticate during install', async () => {
    using _output = captureOutput();

    await run(['mcp', 'install', '--ide', 'claude', '--profile', 'staging']);

    expect(mockAuthenticate).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'login', profile: 'staging' }),
    );
  });

  it('forwards profile to authenticate during auth refresh', async () => {
    using _output = captureOutput();

    await run(['mcp', 'auth', '--ide', 'claude', '--profile', 'staging']);

    expect(mockAuthenticate).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'login', profile: 'staging' }),
    );
  });
});

describe('--dir', () => {
  it('passes cwd when --dir is omitted', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();

    await run(['mcp', 'install', '--ide', 'claude']);

    expect(mockIntegration.connectMcpServer).toHaveBeenCalledWith(
      expect.objectContaining({ projectDir: process.cwd() }),
    );
  });

  it('resolves --dir to an absolute path', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();

    await run(['mcp', 'install', '--ide', 'claude', '--dir', 'some/relative/path']);

    expect(mockIntegration.connectMcpServer).toHaveBeenCalledWith(
      expect.objectContaining({ projectDir: resolve('some/relative/path') }),
    );
  });

  it('passes --dir through to status detection', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();

    await run(['mcp', 'status', '--ide', 'claude', '--dir', '/tmp/my-project', '--json']);

    expect(mockIntegration.detectMcpStatuses).toHaveBeenCalledWith('/tmp/my-project');
  });

  it('passes --dir through to auth refresh', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();

    await run(['mcp', 'auth', '--ide', 'claude', '--dir', '/tmp/my-project']);

    expect(mockIntegration.connectMcpServer).toHaveBeenCalledWith(
      expect.objectContaining({ projectDir: '/tmp/my-project' }),
    );
  });
});
