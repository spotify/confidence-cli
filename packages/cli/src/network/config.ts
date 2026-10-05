import { createRequire } from 'node:module';
import { MCP_SERVERS, type McpClientOptions } from '@spotify-confidence/core';

const { version: CLI_VERSION } = createRequire(import.meta.url)('../../package.json') as {
  version: string;
};

export function serverOpts(token: string): McpClientOptions {
  return { serverUrl: MCP_SERVERS['confidence-flags'].url, token, clientVersion: CLI_VERSION };
}
