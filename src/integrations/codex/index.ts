import type { IdeIntegration } from '../types.js';
import { launchChat } from './chat.js';
import { detectPlugins, installPlugins } from './plugins.js';
import { detectMcpStatuses, connectMcpServer, refreshMcpAuth } from './mcp.js';
import { runOnboarding } from './onboarding.js';
import { prepare } from './prepare.js';

export const codexIntegration: IdeIntegration = {
  id: 'codex',
  name: 'Codex',

  launchChat,
  runOnboarding,
  prepare,
  detectPlugins,
  installPlugins,
  detectMcpStatuses,
  connectMcpServer,
  refreshMcpAuth,
};
