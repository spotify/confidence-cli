import ora, { type Ora } from 'ora';
import type { IdeId } from '@spotify-confidence/shared-kernel';
import { message, fail } from '@output/print.js';
import {
  getIntegration,
  getAvailableMcpServers,
  MCP_SERVERS,
  loadPersistedToken,
  authenticate,
  validateToken,
  type McpServerName,
  type McpServerStatus,
  type McpServer,
} from '@spotify-confidence/core';

export async function installMcpServers(
  ideId: IdeId,
  projectDir: string,
  profile?: string,
): Promise<void> {
  const integration = getIntegration(ideId);
  const servers = getAvailableMcpServers();

  const token = await resolveAuthToken({ profile });
  if (!token) return;

  const spinner = ora(`Installing MCP servers for ${integration.name}...`).start();
  const failed: string[] = [];

  for (const server of servers) {
    const serverDef = MCP_SERVERS[server.name];
    spinner.text = `Connecting ${server.name}...`;

    try {
      await integration.connectMcpServer({
        serverName: server.name,
        serverUrl: server.url,
        serverType: serverDef.type,
        serverHeaders: serverDef.headers,
        projectDir,
        accessToken: token,
      });
    } catch (err) {
      failed.push(`${server.name}: ${(err as Error).message}`);
    }
  }

  const action = 'install';
  const success = `MCP servers installed for ${integration.name}`;
  reportResults({ spinner, servers, failed, action, success });
}

export async function uninstallMcpServers(ideId: IdeId, projectDir: string): Promise<void> {
  const integration = getIntegration(ideId);
  const servers = getAvailableMcpServers();
  const spinner = ora(`Removing MCP servers from ${integration.name}...`).start();
  const failed: string[] = [];

  for (const server of servers) {
    spinner.text = `Removing ${server.name}...`;
    try {
      await integration.disconnectMcpServer({
        serverName: server.name,
        projectDir,
      });
    } catch (err) {
      failed.push(`${server.name}: ${(err as Error).message}`);
    }
  }

  const action = 'uninstall';
  const success = `MCP servers removed from ${integration.name}`;
  reportResults({ spinner, servers, failed, action, success });
}

export async function getMcpStatuses(
  ideId: IdeId,
  projectDir: string,
): Promise<Record<McpServerName, McpServerStatus>> {
  const integration = getIntegration(ideId);
  return integration.detectMcpStatuses(projectDir);
}

export async function refreshMcpAuth(
  ideId: IdeId,
  projectDir: string,
  profile?: string,
): Promise<void> {
  const integration = getIntegration(ideId);
  const servers = getAvailableMcpServers();

  const token = await resolveAuthToken({ forceNew: true, profile });
  if (!token) return;

  const spinner = ora('Updating MCP server credentials...').start();
  const failed: string[] = [];

  for (const server of servers) {
    const serverDef = MCP_SERVERS[server.name];
    spinner.text = `Updating ${server.name}...`;

    try {
      await integration.connectMcpServer({
        serverName: server.name,
        serverUrl: server.url,
        serverType: serverDef.type,
        serverHeaders: serverDef.headers,
        projectDir,
        accessToken: token,
      });
    } catch (err) {
      failed.push(`${server.name}: ${(err as Error).message}`);
    }
  }

  const action = 'update';
  const success = 'MCP server credentials updated';
  reportResults({ spinner, servers, failed, action, success });
}

async function resolveAuthToken(opts?: {
  forceNew?: boolean;
  profile?: string;
}): Promise<string | null> {
  if (!opts?.forceNew) {
    const existing = loadPersistedToken(opts?.profile);
    if (existing) {
      const { valid } = validateToken(existing);
      if (valid) return existing;
    }
  }

  try {
    message('Authentication required. Opening browser...');
    const result = await authenticate({
      mode: 'login',
      profile: opts?.profile,
      onUrl: (url) => message(`If the browser did not open, visit:\n${url}`),
    });
    return result.accessToken;
  } catch (err) {
    fail(`Authentication failed: ${(err as Error).message}`);
    return null;
  }
}

function reportResults(opts: {
  spinner: Ora;
  servers: McpServer[];
  action: 'install' | 'uninstall' | 'update';
  failed: string[];
  success: string;
}) {
  const { spinner, action, success, failed, servers } = opts;
  const errorReport = failed.join('\n');

  if (failed.length === 0) {
    spinner.succeed(success);
    return;
  }

  if (failed.length === servers.length) {
    spinner.stop();
    fail(`Failed to ${action} MCP servers:\n${errorReport}`);
    return;
  }

  spinner.stop();
  fail(`Some MCP servers failed to ${action}:\n${errorReport}`);
}
