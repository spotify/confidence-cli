import type { IdeIntegration } from '../types.js';
import { noop as prepare } from '@lib/noop.js';
import { launchChat } from './chat.js';
import { detectPlugins, installPlugins } from './plugins.js';
import { detectMcpStatuses, connectMcpServer, refreshMcpAuth } from './mcp.js';
import { runOnboarding } from './onboarding.js';

export const claudeIntegration: IdeIntegration = {
  id: 'claude',
  name: 'Claude Code',

  launchChat,
  runOnboarding,
  prepare,
  detectPlugins,
  installPlugins,
  detectMcpStatuses,
  connectMcpServer,
  refreshMcpAuth,
};
