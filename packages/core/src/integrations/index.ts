export type {
  IdeIntegration,
  McpConnectOpts,
  McpDisconnectOpts,
  OnboardingOpts,
  OnboardingCallbacks,
  InstalledPlugin,
} from './types.js';

export { getIntegrations, getIntegration } from './registry.js';
export { normalizeStatusLine, extractCodeChanges } from './utils.js';

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
  callMcpTool,
} from './mcp/index.js';
export { detectInstalledPlugins, prepareIde, installPlugin, updatePlugin } from './skills/index.js';
