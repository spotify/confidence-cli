import { readMcpText, type CallToolResult } from '@spotify-confidence/core';
import { error, fail } from '@output/print.js';

export function tryHandleMcpError(result: CallToolResult): boolean {
  if (!result.isError) return false;

  const text = readMcpText(result) || 'MCP tool call failed';
  if (!formatClientListError(text)) {
    fail(text);
  }

  return true;
}

function formatClientListError(text: string): boolean {
  const match = text.match(/^(.*?Available clients are: )(.+)$/s);
  if (!match) return false;

  const [, prefix, clientList] = match;
  fail(prefix.trim());

  for (const client of clientList.split(/,\s*/)) {
    error(`  ${client.trim()}`);
  }
  return true;
}
