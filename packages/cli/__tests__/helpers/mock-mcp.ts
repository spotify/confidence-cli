import type { CallToolResult } from '@spotify-confidence/core';

export function textResult(json: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(json) }] };
}
