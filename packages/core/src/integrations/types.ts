import type { ChildProcess } from 'node:child_process';
import type { IdeId, PluginScope } from '@spotify-confidence/shared-kernel';
import type { McpServerName, McpStatusMap } from './mcp/servers.js';

export type McpConnectOpts = {
  serverName: McpServerName;
  serverUrl: string;
  serverType: string;
  serverHeaders: Record<string, string>;
  projectDir: string;
  accessToken?: string;
};

export type McpDisconnectOpts = {
  serverName: McpServerName;
  projectDir: string;
};

export type OnboardingCallbacks = {
  onStatus: (text: string) => void;
  onStdout: (line: string) => void;
  onStderr: (text: string) => void;
  onComplete: (lines: string[]) => void;
  onError: (message: string) => void;
};

export type OnboardingOpts = {
  prompt: string;
  projectDir: string;
  token?: string;
};

export type ChatOpts = {
  userPrompt?: string;
  systemPrompt?: string;
  cwd: string;
  token?: string;
};

export type IdeIntegration = {
  id: IdeId;
  name: string;

  prepare: () => Promise<void>;

  detectPlugin: (projectDir: string) => Promise<boolean>;
  installPlugin: (projectDir: string, scope?: PluginScope) => Promise<void>;
  updatePlugin: (projectDir: string, scope?: PluginScope) => Promise<void>;
  uninstallPlugin: (projectDir: string, scope?: PluginScope) => Promise<void>;

  detectMcpStatuses: (projectDir: string) => Promise<McpStatusMap>;
  connectMcpServer: (opts: McpConnectOpts) => Promise<void>;
  disconnectMcpServer: (opts: McpDisconnectOpts) => Promise<void>;

  runOnboarding: (opts: OnboardingOpts, callbacks: OnboardingCallbacks) => ChildProcess | null;
  launchChat: (opts: ChatOpts) => void;
};
