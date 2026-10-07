import { execFile } from '../../../exec/exec.js';
import type { McpConnectOpts, McpDisconnectOpts } from '../../types.js';
import { writeMcpEntry, removeMcpEntry } from './config.js';
import { writeCliPermission, removeCliPermission } from './permissions.js';
import { cliConfigPath, globalConfigPath } from '../paths.js';

export async function connectMcpServer(opts: McpConnectOpts): Promise<void> {
  const headers: Record<string, string> = { ...opts.serverHeaders };

  if (opts.accessToken) {
    headers['Authorization'] = `Bearer ${opts.accessToken}`;
  }

  const entry = { type: opts.serverType, url: opts.serverUrl, headers };

  writeMcpEntry(globalConfigPath(), opts.serverName, entry);
  writeCliPermission(cliConfigPath(opts.projectDir), opts.serverName);

  try {
    await execFile('cursor', ['agent', 'mcp', 'enable', opts.serverName]);
  } catch {
    // `cursor` CLI is not always installed; config files were already written above
  }
}

export async function disconnectMcpServer(opts: McpDisconnectOpts): Promise<void> {
  removeMcpEntry(globalConfigPath(), opts.serverName);
  removeCliPermission(cliConfigPath(opts.projectDir), opts.serverName);
}
