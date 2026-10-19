import type { Argv } from 'yargs';
import { noop } from '@spotify-confidence/shared-kernel';
import { print, fail, extractFlags } from '@output/print.js';
import { getAvailableMcpServers, type McpServerStatus } from '@spotify-confidence/core';
import { resolveIde, resolveFlag, resolveProjectDir } from '@features/ide/index.js';
import {
  installMcpServers,
  uninstallMcpServers,
  getMcpStatuses,
  refreshMcpAuth,
} from '@features/mcp/index.js';
import { dryRunGuard } from '@utils/index.js';

const STATUS_LABELS: Record<McpServerStatus, string> = {
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
      .option('dir', {
        type: 'string',
        describe: 'Target project directory',
      })
      .option('ide', {
        type: 'string',
        choices: ['claude', 'cursor', 'codex'] as const,
        describe: 'AI coding agent to configure',
      })
      .command(
        'install',
        'Install Confidence MCP servers for your AI coding agent',
        noop,
        installCmd,
      )
      .command(
        'uninstall',
        'Remove Confidence MCP servers from your AI coding agent',
        noop,
        uninstallCmd,
      )
      .command('status', 'Show MCP server connection status', noop, statusCmd)
      .command('list', 'List available Confidence MCP servers', noop, listCmd)
      .command('auth', 'Re-authenticate MCP servers with a fresh token', noop, authCmd)
      .demandCommand(1)
      .strict();
  },
  handler() {},
};

async function installCmd(argv: Record<string, unknown>): Promise<void> {
  try {
    const ide = await resolveIde(resolveFlag('ide', argv));
    const servers = getAvailableMcpServers().map((s) => s.name);
    if (dryRunGuard(argv, { action: 'install', ide, servers })) return;
    await installMcpServers(ide, resolveProjectDir(argv), resolveFlag('profile', argv));
  } catch (err) {
    fail((err as Error).message);
  }
}

async function uninstallCmd(argv: Record<string, unknown>): Promise<void> {
  try {
    const ide = await resolveIde(resolveFlag('ide', argv));
    const servers = getAvailableMcpServers().map((s) => s.name);
    if (dryRunGuard(argv, { action: 'uninstall', ide, servers })) return;
    await uninstallMcpServers(ide, resolveProjectDir(argv));
  } catch (err) {
    fail((err as Error).message);
  }
}

async function statusCmd(argv: Record<string, unknown>): Promise<void> {
  try {
    const ide = await resolveIde(resolveFlag('ide', argv));
    const statuses = await getMcpStatuses(ide, resolveProjectDir(argv));
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
}

function listCmd(argv: Record<string, unknown>): void {
  const servers = getAvailableMcpServers();
  print({
    data: servers.map((s) => ({ name: s.name, url: s.url })),
    columns: [
      { key: 'name', header: 'Server', width: 20 },
      { key: 'url', header: 'URL' },
    ],
    flags: extractFlags(argv),
  });
}

async function authCmd(argv: Record<string, unknown>): Promise<void> {
  try {
    const ide = await resolveIde(resolveFlag('ide', argv));
    const servers = getAvailableMcpServers().map((s) => s.name);
    if (dryRunGuard(argv, { action: 'auth', ide, servers })) return;
    await refreshMcpAuth(ide, resolveProjectDir(argv), resolveFlag('profile', argv));
  } catch (err) {
    fail((err as Error).message);
  }
}
