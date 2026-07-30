import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCb);

export async function prepare(): Promise<void> {
  try {
    await execFile('agy', ['--version']);
  } catch {
    throw new Error(
      'Antigravity CLI not found. Install it from: https://antigravity.google/docs/cli/install',
    );
  }
}
