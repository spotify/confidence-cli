import { buildTestJwt, prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { warehouseCommand } from '@commands/warehouse.js';
import { captureOutput } from '../helpers/capture.js';
import { createMockIntegration } from '../helpers/mock-integration.js';
import { createRunner } from '../helpers/run-command.js';

const mockIntegration = createMockIntegration({
  detectPlugin: vi.fn().mockResolvedValue(true),
  detectMcpStatuses: vi.fn().mockResolvedValue({
    'confidence-flags': 'connected',
    'confidence-docs': 'connected',
  }),
});

const mockHasSkills = vi.fn().mockReturnValue(true);
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
    hasSkills: () => mockHasSkills(),
    authenticate: (...args: unknown[]) => mockAuthenticate(...args),
  };
});

const run = createRunner(warehouseCommand);

describe('warehouse setup', () => {
  it('launches chat session with correct skill for bigquery', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();

    await run(['warehouse', 'setup', '--warehouse-type', 'bigquery', '--ide', 'claude']);

    expect(mockIntegration.launchChat).toHaveBeenCalledWith(
      expect.objectContaining({
        userPrompt: expect.stringContaining('setup-warehouse-bigquery'),
        cwd: process.cwd(),
      }),
    );
  });

  it('launches chat session with correct skill for snowflake', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();

    await run(['warehouse', 'setup', '--warehouse-type', 'snowflake', '--ide', 'claude']);

    expect(mockIntegration.launchChat).toHaveBeenCalledWith(
      expect.objectContaining({
        userPrompt: expect.stringContaining('setup-warehouse-snowflake'),
      }),
    );
  });

  it('passes auth token to chat session', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();

    await run(['warehouse', 'setup', '--warehouse-type', 'bigquery', '--ide', 'claude']);

    expect(mockIntegration.launchChat).toHaveBeenCalledWith(
      expect.objectContaining({ token: expect.any(String) }),
    );
  });

  it('fails when plugin is not installed', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockHasSkills.mockReturnValueOnce(false);

    await run(['warehouse', 'setup', '--warehouse-type', 'bigquery', '--ide', 'claude']);

    expect(output.stderr).toContain('Confidence skills not installed');
    expect(mockIntegration.launchChat).not.toHaveBeenCalled();
  });

  it('fails when MCP servers are not installed', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    vi.mocked(mockIntegration.detectMcpStatuses).mockResolvedValueOnce({
      'confidence-flags': 'not-installed',
      'confidence-docs': 'not-installed',
    });

    await run(['warehouse', 'setup', '--warehouse-type', 'bigquery', '--ide', 'claude']);

    expect(output.stderr).toContain('MCP servers not installed');
    expect(mockIntegration.launchChat).not.toHaveBeenCalled();
  });

  it('fails when MCP auth is expired', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    vi.mocked(mockIntegration.detectMcpStatuses).mockResolvedValueOnce({
      'confidence-flags': 'auth-expired',
      'confidence-docs': 'connected',
    });

    await run(['warehouse', 'setup', '--warehouse-type', 'bigquery', '--ide', 'claude']);

    expect(output.stderr).toContain('MCP server auth expired');
    expect(mockIntegration.launchChat).not.toHaveBeenCalled();
  });

  it('fails when authentication is unavailable', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    mockAuthenticate.mockRejectedValueOnce(new Error('Authentication timed out'));

    await run(['warehouse', 'setup', '--warehouse-type', 'bigquery', '--ide', 'claude']);

    expect(output.stderr).toContain('Authentication failed');
    expect(mockIntegration.launchChat).not.toHaveBeenCalled();
  });
});
