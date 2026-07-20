import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCb);

export async function prepare(): Promise<void> {
  try {
    await execFile('codex', ['--version']);
  } catch {
    throw new Error('Codex CLI not found. Install it from: https://codex.openai.com');
  }

  try {
    await execFile('codex', ['login', 'status']);
  } catch {
    throw new Error('Not logged in to Codex. Please, run `codex login` first.');
  }
}
