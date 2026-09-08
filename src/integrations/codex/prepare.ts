import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { extractVersion, isAtLeast } from '../version.js';

const execFile = promisify(execFileCb);

const MIN_VERSION = [0, 146, 0];

export async function prepare(): Promise<void> {
  let stdout: string;
  try {
    ({ stdout } = await execFile('codex', ['--version']));
  } catch {
    throw new Error('Codex CLI not found. Install it from: https://codex.openai.com');
  }

  const version = extractVersion(stdout);
  if (!version || !isAtLeast(version, MIN_VERSION)) {
    throw new Error(
      `Codex CLI ${MIN_VERSION.join('.')} or later is required (found ${stdout.trim()}). Update with: npm update -g @openai/codex`,
    );
  }

  try {
    await execFile('codex', ['login', 'status']);
  } catch {
    throw new Error('Not logged in to Codex. Please, run `codex login` first.');
  }
}
