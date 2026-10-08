import { readMcpText, type CallToolResult } from '@spotify-confidence/core';
import { fail } from '@output/print.js';

type Options = {
  formatError?: (text: string) => void;
  defaultMessage?: string;
};

export function tryHandleMcpError(result: CallToolResult, opts?: Options): boolean {
  if (!result.isError) return false;

  const formatError = opts?.formatError ?? fail;
  const defaultMessage = opts?.defaultMessage ?? 'MCP tool call failed';

  formatError(readMcpText(result) || defaultMessage);
  return true;
}
