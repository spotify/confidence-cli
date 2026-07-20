import type { ChildProcess } from 'node:child_process';
import type { McpServerName, McpServerStatus } from './mcp/servers.js';

export type IdeId = 'claude' | 'cursor' | 'codex';

export type McpConnectOpts = {
  serverName: string;
  serverUrl: string;
  serverType: string;
  serverHeaders: Record<string, string>;
  projectDir: string;
  accessToken?: string;
};

export type McpRefreshOpts = McpConnectOpts & { accessToken: string };

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
  prompt: string;
  cwd: string;
  token?: string;
};

export type IdeIntegration = {
  id: IdeId;
  name: string;

  launchChat: (opts: ChatOpts) => void;

  runOnboarding: (opts: OnboardingOpts, callbacks: OnboardingCallbacks) => ChildProcess | null;

  prepare: () => Promise<void>;

  detectPlugins: (projectDir: string) => boolean;
  installPlugins: (projectDir: string) => Promise<void>;

  detectMcpStatuses: (projectDir: string) => Promise<Record<McpServerName, McpServerStatus>>;
  connectMcpServer: (opts: McpConnectOpts) => Promise<void>;
  refreshMcpAuth: (opts: McpRefreshOpts) => void;
};
