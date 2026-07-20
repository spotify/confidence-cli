/* eslint-disable no-control-regex */
const ANSI_REGEX = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\].*?(?:\x07|\x1B\\))/g;

export function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, '');
}
