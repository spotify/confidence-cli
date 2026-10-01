/** @reason ANSI escape sequences are control characters by definition. */
/* eslint-disable no-control-regex */
const ANSI_REGEX = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\].*?(?:\x07|\x1B\\))/g;

/**
 * Removes all ANSI escape sequences (colors, cursor control, OSC) from a string.
 *
 * Used by {@link TerminalSession.screen} to produce a plain-text view
 * of the terminal output for substring matching in assertions.
 *
 * @param str - Raw string potentially containing ANSI escape codes.
 * @returns The string with all escape sequences removed.
 */
export function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, '');
}
