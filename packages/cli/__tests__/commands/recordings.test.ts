import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import type { CallToolResult } from '@spotify-confidence/core';
import { recordingsCommand } from '@commands/recordings.js';
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

const run = createRunner(recordingsCommand);

describe('recordings policy list', () => {
  it('formats policies as table', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      jsonResult({
        recordingPolicies: [
          { name: 'recordingPolicies/abc', displayName: 'my-app', clients: ['clients/1'] },
          { name: 'recordingPolicies/def', displayName: '', clients: ['clients/2'] },
        ],
        nextPageToken: '',
      }),
    );

    await run(['recordings', 'policy', 'list', '--output', 'table']);

    expect(output.stdout).toContain('my-app');
    expect(output.stdout).toContain('recordingPolicies/abc');
    expect(output.stdout).toContain('(unnamed)');
  });

  it('wraps response in JSON envelope with --json', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      jsonResult({
        recordingPolicies: [
          { name: 'recordingPolicies/abc', displayName: 'my-app', clients: ['clients/1'] },
        ],
        nextPageToken: '',
      }),
    );

    await run(['recordings', 'policy', 'list', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data[0].name).toBe('recordingPolicies/abc');
  });

  it('passes pagination args to MCP tool', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(jsonResult({ recordingPolicies: [], nextPageToken: '' }));

    await run(['recordings', 'policy', 'list', '--page-token', 'abc123']);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'listRecordingPolicies',
      expect.objectContaining({ pageToken: 'abc123' }),
    );
  });

  it('shows next page token when present', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      jsonResult({
        recordingPolicies: [
          { name: 'recordingPolicies/abc', displayName: '', clients: ['clients/1'] },
        ],
        nextPageToken: 'next123',
      }),
    );

    await run(['recordings', 'policy', 'list', '--output', 'table']);

    expect(output.stdout).toContain('--page-token next123');
  });

  it('fails when not logged in', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await run(['recordings', 'policy', 'list']);

    expect(output.stderr).toContain('Not logged in');
  });
});

describe('recordings policy create', () => {
  it('creates a recording policy', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      textResult('Created recording policy: recordingPolicies/123'),
    );

    await run([
      'recordings',
      'policy',
      'create',
      '--display-name',
      'my-app',
      '--client-name',
      'clients/456',
    ]);

    expect(output.stdout).toContain('recordingPolicies/123');
  });

  it('passes correct args to MCP tool', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Created'));

    await run([
      'recordings',
      'policy',
      'create',
      '--display-name',
      'my-app',
      '--client-name',
      'clients/456',
    ]);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'createRecordingPolicy',
      expect.objectContaining({ displayName: 'my-app', clientName: 'clients/456' }),
    );
  });
});

describe('recordings policy get', () => {
  it('outputs policy details with rules', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      jsonResult({
        name: 'recordingPolicies/123',
        displayName: 'my-app',
        clients: ['clients/456'],
        rules: [{ name: 'rules/1', displayName: 'Record all', enabled: true }],
      }),
    );

    await run(['recordings', 'policy', 'get', 'recordingPolicies/123', '--output', 'table']);

    expect(output.stdout).toContain('recordingPolicies/123');
    expect(output.stdout).toContain('my-app');
    expect(output.stdout).toContain('Record all');
    expect(output.stdout).toContain('yes');
  });

  it('reports MCP errors', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockRejectedValueOnce(new Error('Policy not found'));

    await run(['recordings', 'policy', 'get', 'recordingPolicies/999']);

    expect(output.stderr).toContain('Policy not found');
  });
});

describe('recordings rule add', () => {
  it('adds a recording rule', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Added recording rule'));

    await run([
      'recordings',
      'rule',
      'add',
      '--policy',
      'recordingPolicies/123',
      '--targeting-key',
      'visitor_id',
    ]);

    expect(output.stdout).toContain('Added recording rule');
  });

  it('passes all params with defaults to MCP tool', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Added'));

    await run([
      'recordings',
      'rule',
      'add',
      '--policy',
      'recordingPolicies/123',
      '--targeting-key',
      'visitor_id',
    ]);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'addRecordingRule',
      expect.objectContaining({
        recordingPolicy: 'recordingPolicies/123',
        displayName: 'Record all visitors',
        targetingKeySelector: 'visitor_id',
        stableAudiencePercentage: 100,
        sessionSampleRate: 1,
        enabled: false,
      }),
    );
  });

  it('accepts custom audience percentage and sample rate', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Added'));

    await run([
      'recordings',
      'rule',
      'add',
      '--policy',
      'recordingPolicies/123',
      '--targeting-key',
      'visitor_id',
      '--audience-percentage',
      '50',
      '--sample-rate',
      '0.5',
    ]);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'addRecordingRule',
      expect.objectContaining({
        stableAudiencePercentage: 50,
        sessionSampleRate: 0.5,
      }),
    );
  });
});

describe('recordings rule enable', () => {
  it('enables a recording rule', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Rule enabled'));

    await run(['recordings', 'rule', 'enable', 'recordingPolicies/123/rules/456']);

    expect(output.stdout).toContain('Rule enabled');
    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'setRecordingRuleEnabled',
      expect.objectContaining({ recordingRule: 'recordingPolicies/123/rules/456', enabled: true }),
    );
  });
});

describe('recordings rule disable', () => {
  it('disables a recording rule', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Rule disabled'));

    await run(['recordings', 'rule', 'disable', 'recordingPolicies/123/rules/456']);

    expect(output.stdout).toContain('Rule disabled');
    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'setRecordingRuleEnabled',
      expect.objectContaining({ recordingRule: 'recordingPolicies/123/rules/456', enabled: false }),
    );
  });
});

describe('recordings targeting-key show', () => {
  it('formats context schema as table', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      jsonResult({
        fields: [
          { name: 'visitor_id', type: 'string', isEntity: true },
          { name: 'page_url', type: 'string', isEntity: false },
        ],
      }),
    );

    await run(['recordings', 'targeting-key', 'show', 'my-app', '--output', 'table']);

    expect(output.stdout).toContain('visitor_id');
    expect(output.stdout).toContain('yes');
    expect(output.stdout).toContain('page_url');
    expect(output.stdout).toContain('no');
  });

  it('fails when not logged in', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await run(['recordings', 'targeting-key', 'show', 'my-app']);

    expect(output.stderr).toContain('Not logged in');
  });
});

describe('recordings targeting-key add', () => {
  it('adds a context field', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Added field: visitor_id'));

    await run([
      'recordings',
      'targeting-key',
      'add',
      '--field-name',
      'visitor_id',
      '--field-type',
      'string',
    ]);

    expect(output.stdout).toContain('visitor_id');
  });

  it('passes isEntity as string "true" by default', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Added'));

    await run([
      'recordings',
      'targeting-key',
      'add',
      '--field-name',
      'visitor_id',
      '--field-type',
      'string',
    ]);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'addContextField',
      expect.objectContaining({
        fieldName: 'visitor_id',
        fieldType: 'string',
        isEntity: true,
      }),
    );
  });
});
