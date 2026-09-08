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

const STDERR_MAX_LINES = 5;

export function formatOnboardingError(bin: string, stderr: string, code: number | null): string {
  const codeHint = code != null ? ` (code ${code})` : '';
  const headline =
    `${bin} exited with an error${codeHint}. ` +
    `This may be caused by your ${bin} setup (e.g. MCP server auth or stale cache). ` +
    `Please, check your configuration and retry.`;

  const trimmed = stderr.trim();
  if (!trimmed) return headline;

  const lines = trimmed.split('\n');
  const detail = lines.slice(0, STDERR_MAX_LINES).join('\n');
  const overflow =
    lines.length > STDERR_MAX_LINES ? `\n... (${lines.length - STDERR_MAX_LINES} more lines)` : '';

  return `${headline}\n\n${detail}${overflow}`;
}
