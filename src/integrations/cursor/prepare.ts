import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { extractVersion, isAtLeast } from '../version.js';

const execFile = promisify(execFileCb);

const MIN_VERSION = [3, 19, 7];

export async function prepare(): Promise<void> {
  let stdout: string;
  try {
    ({ stdout } = await execFile('cursor', ['-v']));
  } catch {
    throw new Error('Cursor CLI not found. Install Cursor from: https://cursor.com');
  }

  const version = extractVersion(stdout);
  if (!version || !isAtLeast(version, MIN_VERSION)) {
    throw new Error(
      `Cursor ${MIN_VERSION.join('.')} or later is required (found ${stdout.trim()}).\nUpdate Cursor to the latest version from: https://cursor.com`,
    );
  }

  try {
    await execFile('cursor', ['agent', 'status']);
  } catch {
    await execFile('cursor', ['agent', 'login']);
  }
}
