import type { IdeIntegration } from '../types.js';
import { noop as prepare } from '@lib/noop.js';
import { launchChat } from './chat.js';
import { detectPlugin, installPlugin } from './plugins.js';
import { skillsDir } from './paths.js';
import { detectMcpStatuses, connectMcpServer } from './mcp.js';
import { runOnboarding } from './onboarding.js';

export const claudeIntegration: IdeIntegration = {
  id: 'claude',
  name: 'Claude Code',

  launchChat,
  runOnboarding,
  prepare,
  skillsDir,
  detectPlugin,
  installPlugin,
  detectMcpStatuses,
  connectMcpServer,
};
