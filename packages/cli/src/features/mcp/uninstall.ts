import ora from 'ora';
import type { IdeId } from '@spotify-confidence/shared-kernel';
import { getIntegration, getAvailableMcpServers } from '@spotify-confidence/core';
import { reportResults } from './report-results.js';

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

  reportResults({
    spinner,
    servers,
    failed,
    action: 'uninstall',
    success: `MCP servers removed from ${integration.name}`,
  });
}
