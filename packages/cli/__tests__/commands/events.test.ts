import yargs from 'yargs';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import type { CallToolResult } from '@spotify-confidence/core';
import { eventsCommand } from '@commands/events.js';
import { captureOutput } from '../helpers/capture.js';
import { textResult } from '../helpers/mock-mcp.js';
import { SAMPLE_EVENTS } from '../helpers/stubs.js';

const mockMcpCallTool = vi.fn<(...args: unknown[]) => Promise<CallToolResult>>();

vi.mock('@spotify-confidence/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@spotify-confidence/core')>();
  return {
    ...actual,
    mcpCallTool: (...args: unknown[]) => mockMcpCallTool(...args),
  };
});

function run(args: string[]) {
  return yargs(args)
    .option('json', { type: 'boolean', default: false })
    .option('output', { type: 'string' })
    .option('profile', { type: 'string' })
    .option('dry-run', { type: 'boolean', default: false })
    .command(eventsCommand)
    .parse();
}

describe('events list', () => {
  it('outputs event definitions as JSON', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult(SAMPLE_EVENTS));

    await run(['events', 'list', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'page-viewed' })]),
    );
  });

  it('outputs event definitions as a table', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult(SAMPLE_EVENTS));

    await run(['events', 'list', '--output', 'table']);

    expect(output.stdout).toContain('page-viewed');
    expect(output.stdout).toContain('Page Viewed');
    expect(output.stdout).toContain('Name');
  });

  it('shows empty message when no events exist', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult([]));

    await run(['events', 'list', '--output', 'table']);

    expect(output.stdout).toContain('No event definitions found.');
  });

  it('calls list-events tool with pagination args', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult([]));

    await run(['events', 'list', '--page-size', '10', '--page-token', 'abc123']);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'list-events',
      expect.objectContaining({ pageSize: 10, pageToken: 'abc123' }),
    );
  });

  it('fails when not logged in', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await run(['events', 'list', '--json']);

    expect(output.stderr).toContain('Not logged in');
  });
});

describe('events get', () => {
  it('outputs event definition as JSON', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      textResult({
        name: 'page-viewed',
        displayName: 'Page Viewed',
        description: 'Tracks page views',
        fields: [{ name: 'url', type: 'STRING' }],
        createTime: '2026-01-01T00:00:00Z',
        updateTime: '2026-01-02T00:00:00Z',
      }),
    );

    await run(['events', 'get', 'page-viewed', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data).toEqual(
      expect.objectContaining({ name: 'page-viewed', displayName: 'Page Viewed' }),
    );
  });

  it('reports MCP errors', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockRejectedValueOnce(new Error('Event definition not found'));

    await run(['events', 'get', 'missing']);

    expect(output.stderr).toContain('Event definition not found');
  });
});

describe('events create', () => {
  it('creates an event definition', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      textResult({
        name: 'purchase',
        displayName: 'Purchase',
        description: 'Track purchases',
        fields: [
          { name: 'amount', type: 'NUMBER' },
          { name: 'item', type: 'STRING' },
        ],
        createTime: '2026-10-05T00:00:00Z',
      }),
    );

    await run([
      'events',
      'create',
      '--name',
      'Purchase',
      '--description',
      'Track purchases',
      '--field',
      'amount:NUMBER',
      '--field',
      'item:STRING',
      '--json',
    ]);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data).toEqual(expect.objectContaining({ name: 'purchase' }));
  });

  it('prints request body in dry-run mode', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'create', '--name', 'Test Event', '--field', 'page:STRING', '--dry-run']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.displayName).toBe('Test Event');
    expect(parsed.fields).toEqual([{ name: 'page', type: 'STRING' }]);
  });

  it('fails on invalid field spec', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'create', '--name', 'Bad Event', '--field', 'no-type']);

    expect(output.stderr).toContain('Invalid field format');
  });
});

describe('events track', () => {
  it('publishes an event', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce({ content: [] });

    await run(['events', 'track', '--event', 'page-viewed', '--data', '{"url":"/home"}']);

    expect(output.stdout).toContain('Event published successfully.');
    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'track-event',
      expect.objectContaining({ eventDefinition: 'page-viewed', payload: { url: '/home' } }),
    );
  });

  it('prints request body in dry-run mode', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run([
      'events',
      'track',
      '--event',
      'page-viewed',
      '--data',
      '{"url":"/home"}',
      '--dry-run',
    ]);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.eventDefinition).toBe('page-viewed');
    expect(parsed.payload).toEqual({ url: '/home' });
  });

  it('fails on invalid JSON in --data', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'track', '--event', 'page-viewed', '--data', 'not-json']);

    expect(output.stderr).toContain('Invalid JSON in --data');
  });

  it('fails when no data source is provided', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'track', '--event', 'page-viewed']);

    expect(output.stderr).toContain('Provide event data via --data or --from-file');
  });
});

describe('events validate', () => {
  it('reports valid event data', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult({ valid: true }));

    await run(['events', 'validate', '--event', 'page-viewed', '--data', '{"url":"/home"}']);

    expect(output.stdout).toContain('Event data is valid.');
  });

  it('reports validation errors', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      textResult({
        valid: false,
        errors: [{ field: 'url', message: 'Required field missing' }],
      }),
    );

    await run([
      'events',
      'validate',
      '--event',
      'page-viewed',
      '--data',
      '{}',
      '--output',
      'table',
    ]);

    expect(output.stdout).toContain('url');
    expect(output.stdout).toContain('Required field missing');
    expect(process.exitCode).toBe(1);
  });

  it('prints request body in dry-run mode', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run([
      'events',
      'validate',
      '--event',
      'page-viewed',
      '--data',
      '{"url":"/home"}',
      '--dry-run',
    ]);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.eventDefinition).toBe('page-viewed');
  });
});
