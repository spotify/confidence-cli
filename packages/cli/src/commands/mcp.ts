import type { Argv } from 'yargs';
import { print, fail, extractFlags } from '@output/print.js';
import { getAvailableMcpServers } from '@spotify-confidence/core';
import {
  resolveIde,
  installMcpServers,
  uninstallMcpServers,
  getMcpStatuses,
  refreshMcpAuth,
} from '@features/mcp/index.js';
import { resolveProjectDir } from '../utils/resolve-project-dir.js';

const STATUS_LABELS: Record<string, string> = {
  connected: 'Connected',
  installed: 'Installed (unreachable)',
  'auth-expired': 'Auth expired',
  'not-installed': 'Not installed',
};

export const mcpCommand = {
  command: 'mcp <action>',
  describe: 'Manage Confidence MCP server connections',
  builder(yargs: Argv) {
    return yargs
      .command(
        'install',
        'Install Confidence MCP servers for your AI coding agent',
        () => {},
        async (argv) => {
          try {
            const ideId = await resolveIde();
            await installMcpServers(ideId, resolveProjectDir(argv));
          } catch (err) {
            fail((err as Error).message);
          }
        },
      )
      .command(
        'uninstall',
        'Remove Confidence MCP servers from your AI coding agent',
        () => {},
        async (argv) => {
          try {
            const ideId = await resolveIde();
            await uninstallMcpServers(ideId, resolveProjectDir(argv));
          } catch (err) {
            fail((err as Error).message);
          }
        },
      )
      .command(
        'status',
        'Show MCP server connection status',
        () => {},
        async (argv) => {
          try {
            const ideId = await resolveIde();
            const statuses = await getMcpStatuses(ideId, resolveProjectDir(argv));
            const rows = Object.entries(statuses).map(([server, status]) => ({
              server,
              status: STATUS_LABELS[status] ?? status,
            }));
            print({
              data: rows,
              columns: [
                { key: 'server', header: 'Server', width: 20 },
                { key: 'status', header: 'Status' },
              ],
              flags: extractFlags(argv),
            });
          } catch (err) {
            fail((err as Error).message);
          }
        },
      )
      .command(
        'list',
        'List available Confidence MCP servers',
        () => {},
        (argv) => {
          const servers = getAvailableMcpServers();
          print({
            data: servers.map((s) => ({ name: s.name, url: s.url })),
            columns: [
              { key: 'name', header: 'Server', width: 20 },
              { key: 'url', header: 'URL' },
            ],
            flags: extractFlags(argv),
          });
        },
      )
      .command(
        'auth',
        'Re-authenticate MCP servers with a fresh token',
        () => {},
        async (argv) => {
          try {
            const ideId = await resolveIde();
            await refreshMcpAuth(ideId, resolveProjectDir(argv));
          } catch (err) {
            fail((err as Error).message);
          }
        },
      )
      .demandCommand(1, 'Available actions: install, uninstall, status, list, auth')
      .strict();
  },
  handler() {},
};
