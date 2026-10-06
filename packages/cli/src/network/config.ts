import { MCP_SERVERS, type McpClientOptions, type McpServerName } from '@spotify-confidence/core';
import { CLI_VERSION } from '@meta';

export function serverOpts(
  token: string,
  server: McpServerName = 'confidence-flags',
): McpClientOptions {
  return { serverUrl: MCP_SERVERS[server].url, token, clientVersion: CLI_VERSION };
}
