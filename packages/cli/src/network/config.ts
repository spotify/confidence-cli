import { MCP_SERVERS, type McpClientOptions } from '@spotify-confidence/core';
import { CLI_VERSION } from '../meta.js';

export function serverOpts(token: string): McpClientOptions {
  return { serverUrl: MCP_SERVERS['confidence-flags'].url, token, clientVersion: CLI_VERSION };
}
