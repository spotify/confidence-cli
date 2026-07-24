import { STATUS_PREFIX } from './constants.js';

export function normalizeStatusLine(line: string) {
  return line.startsWith(STATUS_PREFIX) ? line.slice(STATUS_PREFIX.length) : line;
}

export function spawnErrorMessage(bin: string, err: NodeJS.ErrnoException): string {
  if (err.code === 'ENOEXEC' || err.code === 'ENOENT') {
    return `${bin} CLI not found or not executable. Make sure it is installed and on your PATH.`;
  }
  return err.message;
}
