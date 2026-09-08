import type { IdeIntegration } from '../types.js';
import { launchChat } from './chat.js';
import { detectPlugin, installPlugin, updatePlugin } from './plugins.js';
import { skillsDir } from './paths.js';
import { detectMcpStatuses, connectMcpServer } from './mcp.js';
import { runOnboarding } from './onboarding.js';
import { prepare } from './prepare.js';

export const codexIntegration: IdeIntegration = {
  id: 'codex',
  name: 'Codex',

  launchChat,
  runOnboarding,
  prepare,
  skillsDir,
  detectPlugin,
  installPlugin,
  updatePlugin,
  detectMcpStatuses,
  connectMcpServer,
};
