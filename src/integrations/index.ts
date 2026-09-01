export type {
  IdeIntegration,
  McpConnectOpts,
  OnboardingOpts,
  OnboardingCallbacks,
  InstalledPlugin,
} from './types.js';

export { getIntegrations, getIntegration } from './registry.js';
export { normalizeStatusLine } from './utils.js';

export { launchChatSession } from './chat.js';
export {
  type McpServer,
  type McpServerName,
  type McpServerStatus,
  MCP_SERVERS,
  allServersConnected,
  getAvailableMcpServers,
  verifyMcpServer,
  loadMcpPreference,
  persistMcpPreference,
  clearMcpPreference,
} from './mcp/index.js';
export { detectInstalledPlugins, prepareIde, installPlugin } from './skills/index.js';
