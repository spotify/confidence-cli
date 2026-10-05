import { extractText, type CallToolResult } from '@spotify-confidence/core';
import { error, fail } from '@output/print.js';

export function handleMcpError(result: CallToolResult): boolean {
  if (!result.isError) return false;

  const text = extractText(result);
  if (!formatClientListError(text)) {
    formatPlainError(text);
  }

  return true;
}

function formatPlainError(text: string): void {
  fail(text);
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
