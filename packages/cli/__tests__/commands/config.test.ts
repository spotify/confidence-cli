import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { configCommand } from '@commands/config.js';
import { getConfigValue, setConfigValue } from '@features/config/index.js';
import { captureOutput } from '../helpers/capture.js';
import { createRunner } from '../helpers/run-command.js';

const run = createRunner(configCommand);

let configDir: string;

beforeEach(() => {
  configDir = mkdtempSync(join(tmpdir(), 'confidence-config-cmd-'));
  process.env['CONFIDENCE_CONFIG_DIR'] = configDir;
});

afterEach(() => {
  delete process.env['CONFIDENCE_CONFIG_DIR'];
});

describe('--dry-run', () => {
  it('prints payload and skips config set', async () => {
    using output = captureOutput();

    await run(['config', 'set', 'project', 'my-project', '--dry-run']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.action).toBe('set');
    expect(parsed.key).toBe('project');
    expect(parsed.value).toBe('my-project');
    expect(getConfigValue('project')).toBeUndefined();
  });

  it('prints payload and skips config reset', async () => {
    setConfigValue('project', 'my-project');
    using output = captureOutput();

    await run(['config', 'reset', '--dry-run']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.action).toBe('reset');
    expect(getConfigValue('project')).toBe('my-project');
  });
});
