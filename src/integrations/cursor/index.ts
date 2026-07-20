import type { IdeIntegration } from '../types.js';
import { launchChat } from './chat.js';
import { detectMcpStatuses, connectMcpServer } from './mcp.js';
import { runOnboarding } from './onboarding.js';
import { detectPlugins, installPlugins } from './plugins.js';
import { prepare } from './prepare.js';

export const cursorIntegration: IdeIntegration = {
  id: 'cursor',
  name: 'Cursor',

  launchChat,
  runOnboarding,
  prepare,
  detectPlugins,
  installPlugins,
  detectMcpStatuses,
  connectMcpServer,
};
