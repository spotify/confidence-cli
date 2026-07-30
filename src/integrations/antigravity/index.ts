import type { IdeIntegration } from '../types.js';
import { launchChat } from './chat.js';
import { detectMcpStatuses, connectMcpServer } from './mcp.js';
import { runOnboarding } from './onboarding.js';
import { detectPlugins, installPlugins } from './plugins.js';
import { prepare } from './prepare.js';

export const antigravityIntegration: IdeIntegration = {
  id: 'antigravity',
  name: 'Antigravity',

  launchChat,
  runOnboarding,
  prepare,
  detectPlugins,
  installPlugins,
  detectMcpStatuses,
  connectMcpServer,
};
