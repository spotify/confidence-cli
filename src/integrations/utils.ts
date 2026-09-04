import { STATUS_PREFIX } from './constants.js';

type StatusLine = `STATUS: ${string}`;

export function isStatusLine(line: string): line is StatusLine {
  return line.startsWith(STATUS_PREFIX);
}

export function normalizeStatusLine(line: StatusLine) {
  return line.slice(STATUS_PREFIX.length);
}

export function normalizeReportLine(line: string) {
  return isStatusLine(line) ? normalizeStatusLine(line) : line;
}

export function spawnErrorMessage(bin: string, err: NodeJS.ErrnoException): string {
  if (err.code === 'ENOEXEC' || err.code === 'ENOENT') {
    return `${bin} CLI not found or not executable. Make sure it is installed and on your PATH.`;
  }
  return err.message;
}
