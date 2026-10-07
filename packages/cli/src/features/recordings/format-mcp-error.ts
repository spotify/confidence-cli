import type { CallToolResult } from '@spotify-confidence/core';
import { error, fail } from '@output/print.js';
import { tryHandleMcpError as baseTryHandleMcpError } from '@utils/index.js';

export function tryHandleMcpError(result: CallToolResult): boolean {
  return baseTryHandleMcpError(result, { formatError: formatClientListError });
}

function formatClientListError(text: string): void {
  const match = text.match(/^(.*?Available clients are: )(.+)$/s);
  if (!match) {
    fail(text);
    return;
  }

  const [, prefix, clientList] = match;
  fail(prefix.trim());

  for (const client of clientList.split(/,\s*/)) {
    error(`  ${client.trim()}`);
  }
}
