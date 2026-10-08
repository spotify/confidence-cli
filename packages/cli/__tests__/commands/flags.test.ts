import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { server, http, HttpResponse, FLAGS_EU_BASE } from '@spotify-confidence/testing';
import type { CallToolResult } from '@spotify-confidence/core';
import { flagsCommand } from '@commands/flags.js';
import { captureOutput } from '../helpers/capture.js';
import { textResult } from '../helpers/mcp-result.js';
import { createRunner } from '../helpers/run-command.js';
import { simulateTTY } from '../helpers/simulate-tty.js';
const tmpDir = join(process.env.TMPDIR ?? '/tmp', 'flags-test');

beforeAll(() => mkdirSync(tmpDir, { recursive: true }));
afterAll(() => rmSync(tmpDir, { recursive: true, force: true }));

const mockConfirm = vi.fn<() => Promise<boolean>>();
const mockMcpCallTool = vi.fn<(...args: unknown[]) => Promise<CallToolResult>>();

vi.mock('@inquirer/confirm', () => ({ default: () => mockConfirm() }));
vi.mock('@spotify-confidence/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@spotify-confidence/core')>();
  return {
    ...actual,
    mcpCallTool: (...args: unknown[]) => mockMcpCallTool(...args),
  };
});

const run = createRunner(flagsCommand);

describe('flags list', () => {
  it('outputs flags in table format', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${FLAGS_EU_BASE}/v1/flags`, () => {
        return HttpResponse.json({
          flags: [
            {
              name: 'flags/dark-mode',
              flagId: 'dark-mode',
              enabled: true,
              variants: [{ name: 'on' }, { name: 'off' }],
            },
            { name: 'flags/new-checkout', flagId: 'new-checkout', enabled: false, variants: [] },
          ],
        });
      }),
    );

    await run(['flags', 'list']);

    expect(output.stdout).toContain('dark-mode');
    expect(output.stdout).toContain('new-checkout');
    expect(output.stdout).toContain('enabled');
  });

  it('wraps response in JSON envelope with --json', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${FLAGS_EU_BASE}/v1/flags`, () => {
        return HttpResponse.json({
          flags: [{ name: 'flags/dark-mode', flagId: 'dark-mode', enabled: true, variants: [] }],
        });
      }),
    );

    await run(['flags', 'list', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data).toHaveLength(1);
    expect(parsed.data[0].flagId).toBe('dark-mode');
  });

  it('shows empty message when no flags exist', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['flags', 'list', '--output', 'table']);

    expect(output.stdout).toContain('No flags found.');
  });

  it('fails when not logged in', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await run(['flags', 'list']);

    expect(output.stderr).toContain('Not logged in');
  });

  it('reports API errors', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${FLAGS_EU_BASE}/v1/flags`, () => {
        return HttpResponse.json({ code: 500, message: 'Internal server error' }, { status: 500 });
      }),
    );

    await run(['flags', 'list']);

    expect(output.stderr).toContain('Internal server error');
  });
});

describe('flags get', () => {
  it('outputs flag details', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${FLAGS_EU_BASE}/v1/flags/dark-mode`, () => {
        return HttpResponse.json({
          name: 'flags/dark-mode',
          flagId: 'dark-mode',
          description: 'Toggle dark mode',
          enabled: true,
          variants: [
            { name: 'flags/dark-mode/variants/on' },
            { name: 'flags/dark-mode/variants/off' },
          ],
          rules: [],
        });
      }),
    );

    await run(['flags', 'get', 'dark-mode']);

    expect(output.stdout).toContain('dark-mode');
    expect(output.stdout).toContain('Toggle dark mode');
    expect(output.stdout).toContain('enabled');
  });

  it('outputs JSON with --json', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${FLAGS_EU_BASE}/v1/flags/dark-mode`, () => {
        return HttpResponse.json({ name: 'flags/dark-mode', flagId: 'dark-mode', enabled: true });
      }),
    );

    await run(['flags', 'get', 'dark-mode', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data.flagId).toBe('dark-mode');
  });

  it('reports flag not found', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${FLAGS_EU_BASE}/v1/flags/missing`, () => {
        return HttpResponse.json({ code: 404, message: 'Flag not found' }, { status: 404 });
      }),
    );

    await run(['flags', 'get', 'missing']);

    expect(output.stderr).toContain('Flag not found');
  });
});

describe('flags create', () => {
  it('creates a flag via MCP', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Created flag: flags/dark-mode'));

    await run(['flags', 'create', 'dark-mode', '--variant', 'on', '--variant', 'off']);

    expect(output.stdout).toContain('dark-mode');
    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'createFlag',
      expect.objectContaining({ flagName: 'dark-mode' }),
    );
  });

  it('prints request body in dry-run mode', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['flags', 'create', 'dark-mode', '--variant', 'on', '--dry-run']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.flagKey).toBe('dark-mode');
    expect(parsed.variants).toEqual(['on']);
  });

  it('reports MCP errors', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockRejectedValueOnce(new Error('Flag already exists'));

    await run(['flags', 'create', 'existing-flag']);

    expect(output.stderr).toContain('Flag already exists');
  });

  it('reads options from --from-file', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Created flag'));

    const dir = join(tmpDir, 'create');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'flag.json');
    writeFileSync(file, JSON.stringify({ description: 'From file', variants: ['a', 'b'] }));

    await run(['flags', 'create', 'new-flag', '--from-file', file]);

    expect(output.stdout).toContain('Created flag');
  });
});

describe('flags update', () => {
  it('updates flag description', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.patch(`${FLAGS_EU_BASE}/v1/flags/dark-mode`, () => {
        return HttpResponse.json({
          name: 'flags/dark-mode',
          flagId: 'dark-mode',
          description: 'New description',
          enabled: true,
        });
      }),
    );

    await run(['flags', 'update', 'dark-mode', '--description', 'New description']);

    expect(output.stdout).toContain('dark-mode');
    expect(output.stdout).toContain('New description');
  });

  it('fails when no changes provided', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['flags', 'update', 'dark-mode']);

    expect(output.stderr).toContain('Provide at least one of');
  });

  it('reads options from --from-file', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.patch(`${FLAGS_EU_BASE}/v1/flags/dark-mode`, () => {
        return HttpResponse.json({
          name: 'flags/dark-mode',
          flagId: 'dark-mode',
          description: 'File desc',
          enabled: true,
        });
      }),
    );

    const dir = join(tmpDir, 'update');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'update.json');
    writeFileSync(file, JSON.stringify({ description: 'File desc' }));

    await run(['flags', 'update', 'dark-mode', '--from-file', file]);

    expect(output.stdout).toContain('File desc');
  });

  it('prints request body in dry-run mode', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['flags', 'update', 'dark-mode', '--description', 'Test', '--dry-run']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.flagKey).toBe('dark-mode');
    expect(parsed.description).toBe('Test');
  });
});

describe('flags toggle', () => {
  it('enables a flag with --on via MCP', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Enabled flag dark-mode for client web-app'));

    await run(['flags', 'toggle', 'dark-mode', '--on', '--client', 'web-app']);

    expect(output.stdout).toContain('Enabled flag dark-mode');
    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'addFlagToClient',
      expect.objectContaining({ flagName: 'dark-mode', clientName: 'web-app' }),
    );
  });

  it('disables a flag with --off via MCP', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Disabled flag dark-mode for client web-app'));

    await run(['flags', 'toggle', 'dark-mode', '--off', '--client', 'web-app']);

    expect(output.stdout).toContain('Disabled flag dark-mode');
    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'removeFlagFromClient',
      expect.objectContaining({ flagName: 'dark-mode', clientName: 'web-app' }),
    );
  });

  it('prints request body in dry-run mode', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['flags', 'toggle', 'dark-mode', '--on', '--client', 'web-app', '--dry-run']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.flagKey).toBe('dark-mode');
    expect(parsed.enabled).toBe(true);
    expect(parsed.client).toBe('web-app');
  });

  it('reports MCP errors', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockRejectedValueOnce(new Error('Flag not found'));

    await run(['flags', 'toggle', 'dark-mode', '--on', '--client', 'web-app']);

    expect(output.stderr).toContain('Flag not found');
  });
});

describe('flags resolve', () => {
  it('resolves flag value', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      textResult('Resolved: dark-mode = on (variant: on, reason: TARGETING_KEY_MATCH)'),
    );

    await run([
      'flags',
      'resolve',
      'dark-mode',
      '--entity',
      'targeting_key',
      '--entity-value',
      'user-123',
    ]);

    expect(output.stdout).toContain('dark-mode');
    expect(output.stdout).toContain('on');
    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'resolveFlag',
      expect.objectContaining({ entity: 'targeting_key', entityValue: 'user-123' }),
    );
  });

  it('passes context pairs to MCP', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Resolved'));

    await run([
      'flags',
      'resolve',
      'dark-mode',
      '--entity',
      'targeting_key',
      '--entity-value',
      'user-123',
      '--context',
      'user=alice',
      '--context',
      'plan=premium',
    ]);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'resolveFlag',
      expect.objectContaining({
        flagName: 'dark-mode',
        context: JSON.stringify({ user: 'alice', plan: 'premium' }),
      }),
    );
  });

  it('fails on invalid context format', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run([
      'flags',
      'resolve',
      'dark-mode',
      '--entity',
      'targeting_key',
      '--entity-value',
      'u1',
      '--context',
      'no-equals',
    ]);

    expect(output.stderr).toContain('Invalid context format');
  });

  it('passes client option', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Resolved'));

    await run([
      'flags',
      'resolve',
      'dark-mode',
      '--entity',
      'targeting_key',
      '--entity-value',
      'u1',
      '--client',
      'web-app',
    ]);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'resolveFlag',
      expect.objectContaining({ clientName: 'web-app' }),
    );
  });
});

describe('flags target', () => {
  it('shows targeting rules', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${FLAGS_EU_BASE}/v1/flags/dark-mode`, () => {
        return HttpResponse.json({
          name: 'flags/dark-mode',
          flagId: 'dark-mode',
          rules: [
            {
              name: 'flags/dark-mode/rules/rule-1',
              enabled: true,
              targetingKeySelector: 'targeting_key',
            },
          ],
        });
      }),
    );

    await run(['flags', 'target', 'dark-mode']);

    expect(output.stdout).toContain('rule-1');
    expect(output.stdout).toContain('true');
  });

  it('shows empty message when no rules', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${FLAGS_EU_BASE}/v1/flags/dark-mode`, () => {
        return HttpResponse.json({ name: 'flags/dark-mode', flagId: 'dark-mode', rules: [] });
      }),
    );

    await run(['flags', 'target', 'dark-mode', '--output', 'table']);

    expect(output.stdout).toContain('No targeting rules configured.');
  });

  it('adds a targeting rule via MCP', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Added targeting rule'));

    await run(['flags', 'target', 'dark-mode', '--add', 'on:80,off:20']);

    expect(output.stdout).toContain('Added targeting rule');
    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'addTargetingRule',
      expect.objectContaining({
        flagName: 'dark-mode',
        variantAllocations: JSON.stringify({ on: 80, off: 20 }),
      }),
    );
  });

  it('fails on invalid allocation format', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['flags', 'target', 'dark-mode', '--add', 'bad-format']);

    expect(output.stderr).toContain('Invalid allocation format');
  });

  it('reads rule from --from-file', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Added targeting rule'));

    const dir = join(tmpDir, 'target');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'rule.json');
    writeFileSync(
      file,
      JSON.stringify({ variantAllocations: { on: 90, off: 10 }, targetingKey: 'user_id' }),
    );

    await run(['flags', 'target', 'dark-mode', '--from-file', file]);

    expect(output.stdout).toContain('Added targeting rule');
    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'addTargetingRule',
      expect.objectContaining({
        flagName: 'dark-mode',
        variantAllocations: JSON.stringify({ on: 90, off: 10 }),
        targetingKey: 'user_id',
      }),
    );
  });

  it('prints request body in dry-run mode', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['flags', 'target', 'dark-mode', '--add', 'on:80,off:20', '--dry-run']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.flagKey).toBe('dark-mode');
    expect(parsed.variantAllocations).toEqual({ on: 80, off: 20 });
  });
});

describe('flags archive', () => {
  it('archives after confirmation', async () => {
    using _auth = prepareAuthTokens('valid');
    using _tty = simulateTTY(true);
    using output = captureOutput();
    mockConfirm.mockResolvedValueOnce(true);
    server.use(
      http.post(`${FLAGS_EU_BASE}/v1/flags/dark-mode\\:archive`, () => {
        return HttpResponse.json({ name: 'flags/dark-mode', archived: true });
      }),
    );

    await run(['flags', 'archive', 'dark-mode']);

    expect(output.stdout).toContain('Flag "dark-mode" archived.');
  });

  it('aborts when user declines', async () => {
    using _auth = prepareAuthTokens('valid');
    using _tty = simulateTTY(true);
    using output = captureOutput();
    mockConfirm.mockResolvedValueOnce(false);

    await run(['flags', 'archive', 'dark-mode']);

    expect(output.stdout).toContain('Aborted.');
  });

  it('skips confirmation with --force', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.post(`${FLAGS_EU_BASE}/v1/flags/dark-mode\\:archive`, () => {
        return HttpResponse.json({ name: 'flags/dark-mode', archived: true });
      }),
    );

    await run(['flags', 'archive', 'dark-mode', '--force']);

    expect(output.stdout).toContain('Flag "dark-mode" archived.');
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it('fails without TTY when --force is not set', async () => {
    using _auth = prepareAuthTokens('valid');
    using _tty = simulateTTY(false);
    using output = captureOutput();

    await run(['flags', 'archive', 'dark-mode']);

    expect(output.stderr).toContain('Cannot prompt for confirmation without a TTY');
  });

  it('prints request body in dry-run mode', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['flags', 'archive', 'dark-mode', '--dry-run']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed).toEqual({ action: 'archive', flagKey: 'dark-mode' });
  });

  it('reports API errors', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.post(`${FLAGS_EU_BASE}/v1/flags/dark-mode\\:archive`, () => {
        return HttpResponse.json({ code: 404, message: 'Flag not found' }, { status: 404 });
      }),
    );

    await run(['flags', 'archive', 'dark-mode', '--force']);

    expect(output.stderr).toContain('Flag not found');
  });
});
