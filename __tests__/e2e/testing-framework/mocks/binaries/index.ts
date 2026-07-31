import { writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { CLAUDE_SCRIPT } from './claude.js';
import { CURSOR_SCRIPT } from './cursor.js';
import { CODEX_SCRIPT } from './codex.js';

/** Filename the mock IDE binary writes the chat prompt to. */
export const CHAT_PROMPT_FILE = '.e2e-chat-prompt';

/** Filename the mock IDE binary writes the onboarding invocation JSON to. */
export const ONBOARDING_INVOCATION_FILE = '.e2e-onboarding-invocation';

function writeMockBinary(dir: string, name: string, script: string): void {
  const filePath = join(dir, name);
  writeFileSync(filePath, script, 'utf-8');
  chmodSync(filePath, 0o755);
}

/**
 * Creates a directory of executable mock IDE binaries (`claude`, `cursor`,
 * `codex`, `open`) that the wizard will find on `PATH` during e2e tests.
 *
 * Each binary is a self-contained Node.js script that simulates the real
 * CLI's interface just enough for the wizard's plugin installation and
 * onboarding flows to complete.
 *
 * @param dir - Parent directory in which to create the `bin/` subdirectory.
 * @returns The absolute path to the created `bin/` directory.
 */
export function createMockBinDir(dir: string): string {
  const binDir = join(dir, 'bin');
  mkdirSync(binDir, { recursive: true });

  writeMockBinary(binDir, 'claude', CLAUDE_SCRIPT);
  writeMockBinary(binDir, 'cursor', CURSOR_SCRIPT);
  writeMockBinary(binDir, 'codex', CODEX_SCRIPT);
  writeMockBinary(binDir, 'open', '#!/bin/sh\nexit 0\n');

  return binDir;
}
