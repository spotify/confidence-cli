import type { IdeIntegration } from '../types.js';
import { launchChat } from './chat.js';
import { detectMcpStatuses, connectMcpServer, disconnectMcpServer } from './mcp/index.js';
import { runOnboarding } from './onboarding.js';
import { detectPlugin, installPlugin, updatePlugin, uninstallPlugin } from './plugins.js';
import { skillsDir } from './paths.js';
import { prepare } from './prepare.js';

export const cursorIntegration: IdeIntegration = {
  id: 'cursor',
  name: 'Cursor',

  launchChat,
  runOnboarding,
  prepare,
  skillsDir,
  detectPlugin,
  installPlugin,
  updatePlugin,
  uninstallPlugin,
  detectMcpStatuses,
  connectMcpServer,
  disconnectMcpServer,
};
