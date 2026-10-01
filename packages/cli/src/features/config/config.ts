import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir, getConfigDir } from '@spotify-confidence/core';

type ConfigKey = 'project' | 'environment' | 'output' | 'profile' | 'ide';

type Config = Partial<Record<ConfigKey, string>>;

const VALID_KEYS: readonly ConfigKey[] = ['project', 'environment', 'output', 'profile', 'ide'];

function configPath(): string {
  return join(getConfigDir(), 'config.json');
}

export function readConfig(): Config {
  const path = configPath();
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Config;
  } catch {
    return {};
  }
}

function writeConfig(config: Config): void {
  const path = configPath();
  ensureDir(join(path, '..'));
  writeFileSync(path, JSON.stringify(config, null, 2), { encoding: 'utf-8', mode: 0o600 });
}

export function getConfigValue(key: string): string | undefined {
  validateKey(key);
  return readConfig()[key as ConfigKey];
}

export function setConfigValue(key: string, value: string): void {
  validateKey(key);
  const config = readConfig();
  config[key as ConfigKey] = value;
  writeConfig(config);
}

export function resetConfig(): void {
  writeConfig({});
}

export function isValidKey(key: string): key is ConfigKey {
  return VALID_KEYS.includes(key as ConfigKey);
}

export function validKeys(): readonly string[] {
  return VALID_KEYS;
}

function validateKey(key: string): asserts key is ConfigKey {
  if (!isValidKey(key)) {
    throw new Error(`Unknown config key "${key}". Valid keys: ${VALID_KEYS.join(', ')}`);
  }
}
