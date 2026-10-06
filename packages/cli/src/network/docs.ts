import { mcpCallTool, type CallToolResult } from '@spotify-confidence/core';
import { serverOpts } from './config.js';

export async function searchDocumentation(
  token: string,
  query: string,
  opts?: { pageToken?: string },
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token, 'confidence-docs'), 'searchDocumentation', {
    query,
    pageToken: opts?.pageToken,
  });
}

export async function grepDocumentation(
  token: string,
  pattern: string,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token, 'confidence-docs'), 'grepDocumentation', { pattern });
}

export async function getFullSource(token: string, page: string): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token, 'confidence-docs'), 'getFullSource', { source: page });
}
