import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

type McpPreference = 'connected' | 'skipped';

const PREFERENCE_FILE = join(tmpdir(), 'confidence_mcp_preference');

export function loadMcpPreference(): McpPreference | null {
  if (!existsSync(PREFERENCE_FILE)) return null;

  try {
    const value = readFileSync(PREFERENCE_FILE, 'utf-8').trim();
    if (value === 'connected' || value === 'skipped') return value;
    return null;
  } catch {
    return null;
  }
}

export function persistMcpPreference(preference: McpPreference): void {
  writeFileSync(PREFERENCE_FILE, preference, 'utf-8');
}

export function clearMcpPreference(): void {
  try {
    unlinkSync(PREFERENCE_FILE);
  } catch {
    // already gone
  }
}
