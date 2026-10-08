import { buildTestJwt, prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { migrateCommand } from '@commands/migrate.js';
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
const mockDetectProviders = vi.fn().mockReturnValue([
  {
    id: 'statsig',
    name: 'Statsig',
    skillName: 'migrate-statsig',
  },
]);

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
    detectProviders: (...args: unknown[]) => mockDetectProviders(...args),
    authenticate: (...args: unknown[]) => mockAuthenticate(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

const run = createRunner(migrateCommand);

describe('migrate detect', () => {
  it('outputs detected providers as JSON', async () => {
    using output = captureOutput();

    await run(['migrate', 'detect', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ provider: 'Statsig', id: 'statsig' })]),
    );
  });

  it('outputs detected providers as a table', async () => {
    using output = captureOutput();

    await run(['migrate', 'detect', '--output', 'table']);

    expect(output.stdout).toContain('Statsig');
    expect(output.stdout).toContain('Provider');
  });

  it('shows message when no providers are detected', async () => {
    mockDetectProviders.mockReturnValueOnce([]);
    using output = captureOutput();

    await run(['migrate', 'detect']);

    expect(output.stdout).toContain('No third-party providers detected.');
  });

  it('includes migration command in output', async () => {
    using output = captureOutput();

    await run(['migrate', 'detect', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ command: 'confidence migrate statsig' })]),
    );
  });
});

describe('migrate <provider>', () => {
  it('launches chat session when all checks pass', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();

    await run(['migrate', 'statsig', '--ide', 'claude']);

    expect(mockIntegration.launchChat).toHaveBeenCalledWith(
      expect.objectContaining({
        userPrompt: expect.stringContaining('Statsig'),
        cwd: process.cwd(),
      }),
    );
  });

  it('includes skill name and provider id in prompt', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();

    await run(['migrate', 'statsig', '--ide', 'claude']);

    const { userPrompt } = vi.mocked(mockIntegration.launchChat).mock.calls[0][0];
    expect(userPrompt).toContain('migrate-statsig');
    expect(userPrompt).toContain('(statsig)');
  });

  it('fails when plugin is not installed', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockHasSkills.mockReturnValueOnce(false);

    await run(['migrate', 'statsig', '--ide', 'claude']);

    expect(output.stderr).toContain('Confidence skills not installed');
    expect(output.stderr).toContain('confidence quickstart');
    expect(mockIntegration.launchChat).not.toHaveBeenCalled();
  });

  it('fails when MCP servers are not installed', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    vi.mocked(mockIntegration.detectMcpStatuses).mockResolvedValueOnce({
      'confidence-flags': 'not-installed',
      'confidence-docs': 'not-installed',
    });

    await run(['migrate', 'statsig', '--ide', 'claude']);

    expect(output.stderr).toContain('MCP servers not installed');
    expect(output.stderr).toContain('confidence mcp install');
    expect(mockIntegration.launchChat).not.toHaveBeenCalled();
  });

  it('fails when MCP auth is expired', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    vi.mocked(mockIntegration.detectMcpStatuses).mockResolvedValueOnce({
      'confidence-flags': 'auth-expired',
      'confidence-docs': 'connected',
    });

    await run(['migrate', 'statsig', '--ide', 'claude']);

    expect(output.stderr).toContain('MCP server auth expired');
    expect(output.stderr).toContain('confidence mcp auth');
    expect(mockIntegration.launchChat).not.toHaveBeenCalled();
  });

  it('passes auth token to chat session', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();

    await run(['migrate', 'statsig', '--ide', 'claude']);

    expect(mockIntegration.launchChat).toHaveBeenCalledWith(
      expect.objectContaining({
        token: expect.stringContaining('eyJ'),
      }),
    );
  });

  it('fails when authentication is unavailable', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    mockAuthenticate.mockRejectedValueOnce(new Error('Authentication timed out'));

    await run(['migrate', 'statsig', '--ide', 'claude']);

    expect(output.stderr).toContain('Authentication failed');
    expect(mockIntegration.launchChat).not.toHaveBeenCalled();
  });
});
