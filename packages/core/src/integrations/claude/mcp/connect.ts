import { execFile } from '../../../exec/exec.js';
import type { McpConnectOpts, McpDisconnectOpts } from '../../types.js';
import { allowMcpToolsInSettings, removeMcpToolsFromSettings } from './settings.js';

export async function connectMcpServer(opts: McpConnectOpts): Promise<void> {
  await unregisterServer(opts);
  await registerServer(opts);
  allowMcpToolsInSettings(opts);
}

export async function disconnectMcpServer(opts: McpDisconnectOpts): Promise<void> {
  removeMcpToolsFromSettings(opts);
  await unregisterServer(opts);
}

async function registerServer(opts: McpConnectOpts): Promise<void> {
  const headers = { ...opts.serverHeaders };
  const args = [
    'mcp',
    'add',
    '--transport',
    'http',
    '--scope',
    'local',
    opts.serverName,
    opts.serverUrl,
  ];

  if (opts.accessToken) {
    headers['Authorization'] = `Bearer ${opts.accessToken}`;
  }

  for (const [key, value] of Object.entries(headers)) {
    args.push('--header', `${key}: ${value}`);
  }

  await execFile('claude', args, { cwd: opts.projectDir });
}

async function unregisterServer(opts: McpDisconnectOpts): Promise<void> {
  await Promise.allSettled(
    (['local', 'project', 'user'] as const).map((scope) =>
      execFile('claude', ['mcp', 'remove', '--scope', scope, opts.serverName], {
        cwd: opts.projectDir,
      }),
    ),
  );
}
