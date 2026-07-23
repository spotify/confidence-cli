import { STATUS_PREFIX } from './constants.js';

export function normalizeStatusLine(line: string) {
  return line.startsWith(STATUS_PREFIX) ? line.slice(STATUS_PREFIX.length) : line;
}
