import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export function readJsonConfig(configPath: string): Record<string, unknown> | null {
  if (!existsSync(configPath)) return null;
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function readOrCreateJsonConfig(configPath: string): Record<string, unknown> {
  const existing = readJsonConfig(configPath);
  if (existing) return existing;

  if (!existsSync(configPath)) {
    mkdirSync(join(configPath, '..'), { recursive: true });
  }

  return {};
}

export function writeJsonConfig(configPath: string, config: Record<string, unknown>): void {
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}
