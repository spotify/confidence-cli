import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import type { CallToolResult } from '@spotify-confidence/core';
import { docsCommand } from '@commands/docs.js';
import { captureOutput } from '../helpers/capture.js';
import { textResult, jsonResult } from '../helpers/mcp-result.js';
import { createRunner } from '../helpers/run-command.js';

const mockMcpCallTool = vi.fn<(...args: unknown[]) => Promise<CallToolResult>>();

vi.mock('@spotify-confidence/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@spotify-confidence/core')>();
  return {
    ...actual,
    mcpCallTool: (...args: unknown[]) => mockMcpCallTool(...args),
  };
});

const run = createRunner(docsCommand);

describe('docs search', () => {
  it('outputs MCP text response', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      textResult('Found 3 results:\n- Feature flags overview\n- SDK quickstart\n- Targeting rules'),
    );

    await run(['docs', 'search', 'feature flags']);

    expect(output.stdout).toContain('Feature flags overview');
    expect(output.stdout).toContain('SDK quickstart');
  });

  it('wraps response in JSON envelope with --json', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      jsonResult({ results: [{ title: 'Feature flags', url: '/docs/flags' }] }),
    );

    await run(['docs', 'search', 'flags', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data.results[0].title).toBe('Feature flags');
  });

  it('passes query to MCP searchDocumentation tool', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult(''));

    await run(['docs', 'search', 'sdk setup']);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'searchDocumentation',
      expect.objectContaining({ query: 'sdk setup' }),
    );
  });

  it('passes pagination token', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult(''));

    await run(['docs', 'search', 'flags', '--page-token', 'abc123']);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'searchDocumentation',
      expect.objectContaining({ pageToken: 'abc123' }),
    );
  });

  it('fails when not logged in', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await run(['docs', 'search', 'flags']);

    expect(output.stderr).toContain('Not logged in');
  });
});

describe('docs grep', () => {
  it('outputs MCP text response', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      textResult('flags/introduction.md:3: Feature flags let you decouple deploy from release.'),
    );

    await run(['docs', 'grep', 'decouple']);

    expect(output.stdout).toContain('decouple deploy from release');
  });

  it('passes pattern to MCP grepDocumentation tool', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult(''));

    await run(['docs', 'grep', 'openfeature']);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'grepDocumentation',
      expect.objectContaining({ pattern: 'openfeature' }),
    );
  });

  it('wraps response in JSON envelope with --json', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(jsonResult({ matches: ['line 1', 'line 2'] }));

    await run(['docs', 'grep', 'flag', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data.matches).toHaveLength(2);
  });

  it('fails when not logged in', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await run(['docs', 'grep', 'flag']);

    expect(output.stderr).toContain('Not logged in');
  });
});

describe('docs read', () => {
  it('outputs full page content', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      textResult('# Feature Flags\n\nFeature flags let you control rollouts.'),
    );

    await run(['docs', 'read', 'flags/introduction']);

    expect(output.stdout).toContain('Feature Flags');
    expect(output.stdout).toContain('control rollouts');
  });

  it('expands bare path to full docs URL', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult(''));

    await run(['docs', 'read', 'sdk/react']);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'getFullSource',
      expect.objectContaining({ source: 'https://confidence.spotify.com/docs/sdk/react' }),
    );
  });

  it('passes full URL as-is', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult(''));

    await run(['docs', 'read', 'https://confidence.spotify.com/docs/api/api-basics']);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'getFullSource',
      expect.objectContaining({
        source: 'https://confidence.spotify.com/docs/api/api-basics',
      }),
    );
  });

  it('wraps response in JSON envelope with --json', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(jsonResult({ content: '# Flags', title: 'Flags' }));

    await run(['docs', 'read', 'flags/introduction', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data.title).toBe('Flags');
  });

  it('fails when not logged in', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await run(['docs', 'read', 'flags/introduction']);

    expect(output.stderr).toContain('Not logged in');
  });
});
