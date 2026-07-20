export type {
  IdeId,
  IdeIntegration,
  McpConnectOpts,
  OnboardingOpts,
  OnboardingCallbacks,
} from './types.js';
export { getIntegrations, getIntegration } from './registry.js';
export {
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
export { launchChatSession } from './chat.js';
export { detectInstalledPlugins, prepareIde, installPlugin } from './plugins.js';
