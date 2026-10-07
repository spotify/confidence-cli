import { readMcpText, type CallToolResult } from '@spotify-confidence/core';
import { fail } from '@output/print.js';

export function tryHandleMcpError(result: CallToolResult): boolean {
  if (!result.isError) return false;

  fail(readMcpText(result) || 'MCP tool call failed');
  return true;
}
