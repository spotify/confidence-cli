import ora from 'ora';
import type { IdeId } from '@spotify-confidence/shared-kernel';
import {
  getIntegration,
  getAvailableMcpServers,
  MCP_SERVERS,
  type IdeIntegration,
} from '@spotify-confidence/core';
import { resolveAuthToken } from './resolve-token.js';
import { reportResults } from './report-results.js';

export async function installMcpServers(
  ideId: IdeId,
  projectDir: string,
  profile?: string,
): Promise<void> {
  const integration = getIntegration(ideId);
  await connectAllServers({
    integration,
    projectDir,
    profile,
    spinnerLabel: `Installing MCP servers for ${integration.name}...`,
    progressVerb: 'Connecting',
    action: 'install',
    success: `MCP servers installed for ${integration.name}`,
  });
}

export async function refreshMcpAuth(
  ideId: IdeId,
  projectDir: string,
  profile?: string,
): Promise<void> {
  await connectAllServers({
    integration: getIntegration(ideId),
    projectDir,
    profile,
    forceNewToken: true,
    spinnerLabel: 'Updating MCP server credentials...',
    progressVerb: 'Updating',
    action: 'update',
    success: 'MCP server credentials updated',
  });
}

async function connectAllServers(opts: {
  integration: IdeIntegration;
  projectDir: string;
  profile?: string;
  forceNewToken?: boolean;
  spinnerLabel: string;
  progressVerb: string;
  action: 'install' | 'update';
  success: string;
}): Promise<void> {
  const servers = getAvailableMcpServers();

  const token = await resolveAuthToken({ forceNew: opts.forceNewToken, profile: opts.profile });
  if (!token) return;

  const spinner = ora(opts.spinnerLabel).start();
  const failed: string[] = [];

  for (const server of servers) {
    const serverDef = MCP_SERVERS[server.name];
    spinner.text = `${opts.progressVerb} ${server.name}...`;

    try {
      await opts.integration.connectMcpServer({
        serverName: server.name,
        serverUrl: server.url,
        serverType: serverDef.type,
        serverHeaders: serverDef.headers,
        projectDir: opts.projectDir,
        accessToken: token,
      });
    } catch (err) {
      failed.push(`${server.name}: ${(err as Error).message}`);
    }
  }

  reportResults({ spinner, servers, failed, action: opts.action, success: opts.success });
}
