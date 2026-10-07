import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import type { CallToolResult } from '@spotify-confidence/core';
import { warehouseCommand } from '@commands/warehouse.js';
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

const run = createRunner(warehouseCommand);

describe('warehouse validate', () => {
  it('shows validation results as table', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      jsonResult({
        successful: true,
        validation: [
          { key: 'CONNECTION', description: 'Can connect', success: true },
          { key: 'PERMISSIONS', description: 'Has permissions', success: true },
        ],
      }),
    );

    await run([
      'warehouse',
      'validate',
      '--warehouse-type',
      'bigquery',
      '--config-json',
      '{"gcpProjectId":"my-project"}',
      '--output',
      'table',
    ]);

    expect(output.stdout).toContain('Validation passed');
    expect(output.stdout).toContain('PASS');
    expect(output.stdout).toContain('CONNECTION');
  });

  it('reports failures with non-zero exit code', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      jsonResult({
        successful: false,
        validation: [
          {
            key: 'PERMISSIONS',
            description: 'Has permissions',
            success: false,
            error: 'Missing bigquery.jobs.create',
          },
        ],
      }),
    );

    await run([
      'warehouse',
      'validate',
      '--warehouse-type',
      'bigquery',
      '--config-json',
      '{"gcpProjectId":"my-project"}',
      '--output',
      'table',
    ]);

    expect(output.stdout).toContain('Validation failed');
    expect(output.stdout).toContain('FAIL');
    expect(process.exitCode).toBe(1);
  });

  it('outputs full response with --json', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      jsonResult({
        successful: true,
        validation: [{ key: 'CONNECTION', description: 'Can connect', success: true }],
      }),
    );

    await run([
      'warehouse',
      'validate',
      '--warehouse-type',
      'bigquery',
      '--config-json',
      '{"gcpProjectId":"my-project"}',
      '--json',
    ]);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data.successful).toBe(true);
  });

  it('passes correct args to MCP tool', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(jsonResult({ successful: true, validation: [] }));

    await run([
      'warehouse',
      'validate',
      '--warehouse-type',
      'snowflake',
      '--config-json',
      '{"account":"abc"}',
    ]);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'validateWarehouseConfig',
      expect.objectContaining({ warehouseType: 'snowflake', configJson: '{"account":"abc"}' }),
    );
  });

  it('fails when not logged in', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await run(['warehouse', 'validate', '--warehouse-type', 'bigquery', '--config-json', '{}']);

    expect(output.stderr).toContain('Not logged in');
  });
});

describe('warehouse create', () => {
  it('creates a warehouse and outputs result', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Created warehouse: dataWarehouses/abc123'));

    await run([
      'warehouse',
      'create',
      '--warehouse-type',
      'bigquery',
      '--config-json',
      '{"gcpProjectId":"my-project","dataset":"confidence"}',
    ]);

    expect(output.stdout).toContain('dataWarehouses/abc123');
  });

  it('passes correct args to MCP tool', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Created'));

    const configJson = '{"gcpProjectId":"proj","dataset":"ds"}';
    await run([
      'warehouse',
      'create',
      '--warehouse-type',
      'databricks',
      '--config-json',
      configJson,
    ]);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'createWarehouse',
      expect.objectContaining({ warehouseType: 'databricks', configJson }),
    );
  });
});

describe('warehouse connector create-flag-applied', () => {
  it('creates a flag applied connector', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Created flag applied connection'));

    await run([
      'warehouse',
      'connector',
      'create-flag-applied',
      '--warehouse-type',
      'bigquery',
      '--config-json',
      '{"table":"confidence_flag_applied"}',
    ]);

    expect(output.stdout).toContain('Created flag applied connection');
  });

  it('passes correct args to MCP tool', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Created'));

    await run([
      'warehouse',
      'connector',
      'create-flag-applied',
      '--warehouse-type',
      'redshift',
      '--config-json',
      '{"cluster":"my-cluster"}',
    ]);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'createFlagAppliedConnection',
      expect.objectContaining({
        warehouseType: 'redshift',
        configJson: '{"cluster":"my-cluster"}',
      }),
    );
  });
});

describe('warehouse connector create-event', () => {
  it('creates an event connector', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Created event connection'));

    await run([
      'warehouse',
      'connector',
      'create-event',
      '--warehouse-type',
      'snowflake',
      '--config-json',
      '{"tablePrefix":"events_"}',
    ]);

    expect(output.stdout).toContain('Created event connection');
  });

  it('passes correct args to MCP tool', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Created'));

    await run([
      'warehouse',
      'connector',
      'create-event',
      '--warehouse-type',
      'snowflake',
      '--config-json',
      '{"tablePrefix":"events_"}',
    ]);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'createEventConnection',
      expect.objectContaining({
        warehouseType: 'snowflake',
        configJson: '{"tablePrefix":"events_"}',
      }),
    );
  });
});

describe('warehouse assignment-table create', () => {
  it('creates an assignment table', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Created assignment table'));

    await run([
      'warehouse',
      'assignment-table',
      'create',
      '--display-name',
      'Flag Assignments',
      '--sql',
      'SELECT * FROM assignments',
      '--entity-column',
      'targeting_key',
      '--timestamp-column',
      'assignment_time',
      '--exposure-key-column',
      'rule',
      '--variant-key-column',
      'assignment_id',
    ]);

    expect(output.stdout).toContain('Created assignment table');
  });

  it('passes correct args to MCP tool', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Created'));

    await run([
      'warehouse',
      'assignment-table',
      'create',
      '--display-name',
      'My Table',
      '--sql',
      'SELECT col FROM t',
      '--entity-column',
      'user_id',
      '--timestamp-column',
      'ts',
      '--exposure-key-column',
      'exp',
      '--variant-key-column',
      'var',
    ]);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'createAssignmentTable',
      expect.objectContaining({
        displayName: 'My Table',
        sql: 'SELECT col FROM t',
        entityColumn: 'user_id',
        timestampColumn: 'ts',
        exposureKeyColumn: 'exp',
        variantKeyColumn: 'var',
      }),
    );
  });

  it('fails when not logged in', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await run([
      'warehouse',
      'assignment-table',
      'create',
      '--display-name',
      'Test',
      '--sql',
      'SELECT 1',
      '--entity-column',
      'a',
      '--timestamp-column',
      'b',
      '--exposure-key-column',
      'c',
      '--variant-key-column',
      'd',
    ]);

    expect(output.stderr).toContain('Not logged in');
  });
});

describe('warehouse crypto-key create', () => {
  it('creates a crypto key', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(
      textResult('Created crypto key: cryptoKeys/snowflake-key'),
    );

    await run(['warehouse', 'crypto-key', 'create', '--crypto-key-id', 'snowflake-key']);

    expect(output.stdout).toContain('cryptoKeys/snowflake-key');
  });

  it('passes correct args to MCP tool', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce(textResult('Created'));

    await run(['warehouse', 'crypto-key', 'create', '--crypto-key-id', 'my-key']);

    expect(mockMcpCallTool).toHaveBeenCalledWith(
      expect.anything(),
      'createCryptoKey',
      expect.objectContaining({ cryptoKeyId: 'my-key' }),
    );
  });
});

describe('warehouse MCP error handling', () => {
  it('reports MCP errors to stderr', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    mockMcpCallTool.mockResolvedValueOnce({
      isError: true,
      content: [{ type: 'text', text: 'Warehouse type not supported' }],
    });

    await run(['warehouse', 'create', '--warehouse-type', 'bigquery', '--config-json', '{}']);

    expect(output.stderr).toContain('Warehouse type not supported');
  });
});
