import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCb);

export async function prepare(): Promise<void> {
  try {
    await execFile('cursor', ['agent', '--version']);
  } catch {
    throw new Error(
      'Cursor Agent CLI not found. Install it with: cursor agent install-shell-integration',
    );
  }

  try {
    await execFile('cursor', ['agent', 'status']);
  } catch {
    await execFile('cursor', ['agent', 'login']);
  }
}
