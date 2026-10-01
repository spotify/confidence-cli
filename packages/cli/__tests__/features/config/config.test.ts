import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  readConfig,
  getConfigValue,
  setConfigValue,
  resetConfig,
  isValidKey,
} from '@features/config/config.js';

let configDir: string;

beforeEach(() => {
  configDir = mkdtempSync(join(tmpdir(), 'confidence-config-test-'));
  process.env['CONFIDENCE_CONFIG_DIR'] = configDir;
});

afterEach(() => {
  delete process.env['CONFIDENCE_CONFIG_DIR'];
});

describe('readConfig', () => {
  it('returns an empty object when no config file exists', () => {
    const sut = readConfig;

    expect(sut()).toEqual({});
  });
});

describe('setConfigValue / getConfigValue', () => {
  it('persists and retrieves a value', () => {
    setConfigValue('project', 'my-project');

    expect(getConfigValue('project')).toBe('my-project');
  });

  it('writes valid JSON to the config file', () => {
    setConfigValue('environment', 'production');

    const raw = readFileSync(join(configDir, 'config.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual({ environment: 'production' });
  });

  it('throws on an unknown key', () => {
    expect(() => setConfigValue('unknown-key', 'val')).toThrow('Unknown config key');
  });
});

describe('resetConfig', () => {
  it('clears all stored values', () => {
    setConfigValue('project', 'my-project');
    setConfigValue('environment', 'staging');

    resetConfig();

    expect(readConfig()).toEqual({});
    expect(existsSync(join(configDir, 'config.json'))).toBe(true);
  });
});

describe('isValidKey', () => {
  it.each(['project', 'environment', 'output', 'profile', 'ide'])('accepts "%s"', (key) => {
    expect(isValidKey(key)).toBe(true);
  });

  it('rejects unknown keys', () => {
    expect(isValidKey('banana')).toBe(false);
  });
});
