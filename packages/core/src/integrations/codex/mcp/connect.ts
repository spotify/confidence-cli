import { execFile } from '../../../exec/exec.js';
import type { McpConnectOpts, McpDisconnectOpts } from '../../types.js';
import { removeTomlSection, ensureTomlSection, patchHttpHeaders } from './toml.js';
import { globalConfigPath, projectConfigPath } from '../paths.js';

export async function connectMcpServer(opts: McpConnectOpts): Promise<void> {
  try {
    await execFile('codex', ['mcp', 'remove', opts.serverName]);
  } catch {
    // Server may not be registered yet; the subsequent `mcp add` is idempotent
  }

  await execFile('codex', ['mcp', 'add', opts.serverName, '--url', opts.serverUrl]);

  const headers: Record<string, string> = { ...opts.serverHeaders };
  if (opts.accessToken) {
    headers['Authorization'] = `Bearer ${opts.accessToken}`;
  }

  const configPath = globalConfigPath();
  ensureTomlSection(opts.serverName, opts.serverUrl, configPath);
  patchHttpHeaders(opts.serverName, headers, configPath);
}

export function disconnectMcpServer(opts: McpDisconnectOpts): Promise<void> {
  removeTomlSection(projectConfigPath(opts.projectDir), opts.serverName);
  removeTomlSection(globalConfigPath(), opts.serverName);
  return Promise.resolve();
}
