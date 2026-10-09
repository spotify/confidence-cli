import type { IdeIntegration } from '../types.js';
import { launchChat } from './chat.js';
import { detectPlugin, installPlugin, updatePlugin, uninstallPlugin } from './plugins.js';
import { detectMcpStatuses, connectMcpServer, disconnectMcpServer } from './mcp/index.js';
import { runOnboarding } from './onboarding.js';
import { prepare } from './prepare.js';

export const claudeIntegration: IdeIntegration = {
  id: 'claude',
  name: 'Claude Code',

  launchChat,
  runOnboarding,
  prepare,
  detectPlugin,
  installPlugin,
  updatePlugin,
  uninstallPlugin,
  detectMcpStatuses,
  connectMcpServer,
  disconnectMcpServer,
};
