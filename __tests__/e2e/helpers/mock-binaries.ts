import { writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { CLAUDE_SCRIPT } from './mock-claude.js';
import { CURSOR_SCRIPT } from './mock-cursor.js';
import { CODEX_SCRIPT } from './mock-codex.js';

export const CHAT_PROMPT_FILE = '.e2e-chat-prompt';
export const ONBOARDING_INVOCATION_FILE = '.e2e-onboarding-invocation';

function writeMockBinary(dir: string, name: string, script: string): void {
  const filePath = join(dir, name);
  writeFileSync(filePath, script, 'utf-8');
  chmodSync(filePath, 0o755);
}

export function createMockBinDir(dir: string): string {
  const binDir = join(dir, 'bin');
  mkdirSync(binDir, { recursive: true });

  writeMockBinary(binDir, 'claude', CLAUDE_SCRIPT);
  writeMockBinary(binDir, 'cursor', CURSOR_SCRIPT);
  writeMockBinary(binDir, 'codex', CODEX_SCRIPT);
  writeMockBinary(binDir, 'open', '#!/bin/sh\nexit 0\n');

  return binDir;
}
