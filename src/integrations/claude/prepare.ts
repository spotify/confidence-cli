import { execFile } from '@lib/exec.js';
import { extractVersion, isAtLeast } from '../version.js';

const MIN_VERSION = [2, 1, 212];

export async function prepare(): Promise<void> {
  let stdout: string;
  try {
    ({ stdout } = await execFile('claude', ['--version']));
  } catch {
    throw new Error(
      'Claude Code CLI not found. Install it from: https://docs.anthropic.com/en/docs/claude-code/getting-started',
    );
  }

  const version = extractVersion(stdout);
  if (!version || !isAtLeast(version, MIN_VERSION)) {
    throw new Error(
      `Claude Code ${MIN_VERSION.join('.')} or later is required (found ${stdout.trim()}).\nUpdate with: npm update -g @anthropic-ai/claude-code`,
    );
  }
}
