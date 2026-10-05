import yargs from 'yargs';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import type { CallToolResult } from '@spotify-confidence/core';
import { eventsCommand } from '@commands/events.js';
import { captureOutput } from '../helpers/capture.js';

const mockConfirm = vi.fn<() => Promise<boolean>>();
const mockMcpCallTool = vi.fn<(...args: unknown[]) => Promise<CallToolResult>>();

vi.mock('@inquirer/confirm', () => ({ default: () => mockConfirm() }));
vi.mock('@spotify-confidence/quickstart', () => ({ startTui: vi.fn() }));
vi.mock('@spotify-confidence/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@spotify-confidence/core')>();
  return {
    ...actual,
    mcpCallTool: (...args: unknown[]) => mockMcpCallTool(...args),
  };
});

function textResult(text: string): CallToolResult {
  return { content: [{ type: 'text', text }] };
}

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
  it('outputs MCP text response', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      textResult('Found 2 event(s):\n- page-viewed\n- button-clicked'),
    );

    await run(['events', 'list']);

    expect(output.stdout).toContain('page-viewed');
    expect(output.stdout).toContain('button-clicked');
  });

  it('wraps response in JSON envelope with --json', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Found 1 event(s):\n- page-viewed'));

    await run(['events', 'list', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data).toContain('page-viewed');
  });

  it('passes pagination args to MCP tool', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult(''));

    await run(['events', 'list', '--page-token', 'abc123']);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'listEventDefinitions',
      expect.objectContaining({ pageToken: 'abc123' }),
    );
  });

  it('fails when not logged in', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await run(['events', 'list']);

    expect(output.stderr).toContain('Not logged in');
  });
});

describe('events get', () => {
  it('outputs event definition text', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      textResult('Event Definition: eventDefinitions/page-viewed\nSchema:\n  - url: string'),
    );

    await run(['events', 'get', 'page-viewed']);

    expect(output.stdout).toContain('page-viewed');
    expect(output.stdout).toContain('url');
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
    mockMcpCallTool.mockResolvedValueOnce(textResult('Created event: eventDefinitions/purchase'));

    await run([
      'events',
      'create',
      '--name',
      'purchase',
      '--field',
      'amount:double',
      '--field',
      'item:string',
    ]);

    expect(output.stdout).toContain('purchase');
  });

  it('prints request body in dry-run mode', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'create', '--name', 'test-event', '--field', 'page:string', '--dry-run']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.eventDefinitionId).toBe('test-event');
    expect(parsed.schema).toEqual({ page: { stringSchema: {} } });
  });

  it('fails on invalid field spec', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'create', '--name', 'bad-event', '--field', 'no-type']);

    expect(output.stderr).toContain('Invalid field format');
  });
});

describe('events update', () => {
  it('adds fields to an event definition', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      textResult('Updated event: eventDefinitions/page-viewed'),
    );

    await run(['events', 'update', 'page-viewed', '--field', 'referrer:STRING']);

    expect(output.stdout).toContain('page-viewed');
  });
});

describe('events delete', () => {
  it('deletes after confirmation', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockConfirm.mockResolvedValueOnce(true);
    mockMcpCallTool.mockResolvedValueOnce(textResult('Deleted'));

    await run(['events', 'delete', 'old-event']);

    expect(output.stdout).toContain('Event definition "old-event" deleted.');
  });

  it('aborts when user declines', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockConfirm.mockResolvedValueOnce(false);

    await run(['events', 'delete', 'old-event']);

    expect(output.stdout).toContain('Aborted.');
    expect(mockMcpCallTool).not.toHaveBeenCalled();
  });
});

describe('events usage', () => {
  it('shows event usage stats', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      textResult('Usage for page-viewed (7 days):\n12:00 — 150 published, 3 failures'),
    );

    await run(['events', 'usage', 'page-viewed']);

    expect(output.stdout).toContain('150 published');
  });
});
