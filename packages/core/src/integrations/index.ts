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
  type McpStatusMap,
  MCP_SERVERS,
  allServersConnected,
  getAvailableMcpServers,
  verifyMcpServer,
  loadMcpPreference,
  persistMcpPreference,
  clearMcpPreference,
} from './mcp/index.js';
export {
  detectInstalledPlugins,
  prepareIde,
  installPlugin,
  uninstallPlugin,
  updatePlugin,
} from './skills/index.js';
