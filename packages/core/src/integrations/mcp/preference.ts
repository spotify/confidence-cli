import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getConfigDir } from '../../auth/credentials/paths.js';

type McpPreference = 'connected' | 'skipped';

function preferencePath(): string {
  return join(getConfigDir(), 'mcp_preference');
}

export function loadMcpPreference(): McpPreference | null {
  const file = preferencePath();
  if (!existsSync(file)) return null;

  try {
    const value = readFileSync(file, 'utf-8').trim();
    return ['connected', 'skipped'].includes(value) ? (value as McpPreference) : null;
  } catch {
    return null;
  }
}

export function persistMcpPreference(preference: McpPreference): void {
  mkdirSync(getConfigDir(), { recursive: true });
  writeFileSync(preferencePath(), preference, 'utf-8');
}

export function clearMcpPreference(): void {
  try {
    unlinkSync(preferencePath());
  } catch {
    // already gone
  }
}
