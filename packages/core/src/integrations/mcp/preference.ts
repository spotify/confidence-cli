import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getConfigDir } from '../../auth/credentials/paths.js';

type McpPreference = 'connected' | 'skipped';

const PREFERENCE_FILE = join(getConfigDir(), 'mcp_preference');

export function loadMcpPreference(): McpPreference | null {
  if (!existsSync(PREFERENCE_FILE)) return null;

  try {
    const value = readFileSync(PREFERENCE_FILE, 'utf-8').trim();
    return ['connected', 'skipped'].includes(value) ? (value as McpPreference) : null;
  } catch {
    return null;
  }
}

export function persistMcpPreference(preference: McpPreference): void {
  mkdirSync(getConfigDir(), { recursive: true });
  writeFileSync(PREFERENCE_FILE, preference, 'utf-8');
}

export function clearMcpPreference(): void {
  try {
    unlinkSync(PREFERENCE_FILE);
  } catch {
    // already gone
  }
}
