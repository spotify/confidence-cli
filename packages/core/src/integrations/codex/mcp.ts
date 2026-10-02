import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFile } from '../../exec/exec.js';
import type { McpConnectOpts, McpDisconnectOpts } from '../types.js';
import {
  MCP_SERVERS,
  type McpServerName,
  type McpServerStatus,
  detectMcpStatuses as detectShared,
} from '../mcp/servers.js';
import { globalConfigPath, projectConfigPath } from './paths.js';

export function detectMcpStatuses(
  projectDir: string,
): Promise<Record<McpServerName, McpServerStatus>> {
  return detectShared({
    getRegisteredNames: () => getRegisteredMcpNames(projectDir),
    getAuthToken: (name) => getStoredAuthToken(name),
  });
}

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

  patchHttpHeaders(opts.serverName, headers);
}

export function disconnectMcpServer(opts: McpDisconnectOpts): Promise<void> {
  removeTomlSection(projectConfigPath(opts.projectDir), opts.serverName);
  removeTomlSection(globalConfigPath(), opts.serverName);
  return Promise.resolve();
}

function getRegisteredMcpNames(projectDir: string): McpServerName[] {
  const names = Object.keys(MCP_SERVERS) as McpServerName[];
  const paths = [globalConfigPath(), projectConfigPath(projectDir)];

  return names.filter((name) =>
    paths.some((configPath) => {
      try {
        const content = readFileSync(configPath, 'utf-8');
        return content.includes(`[mcp_servers.${name}]`) || content.includes(`"${name}"`);
      } catch {
        // Config file doesn't exist — server is not registered in this scope
        return false;
      }
    }),
  );
}

function getStoredAuthToken(serverName: McpServerName): string | null {
  try {
    const content = readFileSync(globalConfigPath(), 'utf-8');
    const sectionHeader = `[mcp_servers.${serverName}]`;
    const idx = content.indexOf(sectionHeader);
    if (idx === -1) return null;

    const nextSection = content.indexOf('\n[', idx + sectionHeader.length);
    const section = content.slice(idx, nextSection === -1 ? undefined : nextSection);
    const match = section.match(/"Authorization"\s*=\s*"Bearer\s+([^"]+)"/);
    return match?.[1] ?? null;
  } catch {
    // Config file missing or unreadable — treat as no stored token
    return null;
  }
}

function removeTomlSection(configPath: string, serverName: string): void {
  if (!existsSync(configPath)) return;
  try {
    const content = readFileSync(configPath, 'utf-8');
    const sectionHeader = `[mcp_servers.${serverName}]`;
    const idx = content.indexOf(sectionHeader);
    if (idx === -1) return;

    const nextSection = content.indexOf('\n[', idx + sectionHeader.length);
    const before = content.slice(0, idx).replace(/\n+$/, '');
    const after = nextSection === -1 ? '' : content.slice(nextSection);
    const result = (before + after).trim();

    writeFileSync(configPath, result ? result + '\n' : '', 'utf-8');
  } catch {
    // Corrupt or unreadable config — server is effectively unregistered already
  }
}

export function patchHttpHeaders(
  serverName: string,
  headers: Readonly<Record<string, string>>,
): void {
  if (Object.keys(headers).length === 0) return;

  const configPath = globalConfigPath();
  try {
    let content = readFileSync(configPath, 'utf-8');

    const sectionHeader = `[mcp_servers.${serverName}]`;
    const idx = content.indexOf(sectionHeader);
    if (idx === -1) return;

    const nextSection = content.indexOf('\n[', idx + sectionHeader.length);
    const sectionEnd = nextSection === -1 ? content.length : nextSection;
    const sectionSlice = content.slice(idx, sectionEnd);

    const entries = Object.entries(headers)
      .map(([k, v]) => `"${k}" = "${v}"`)
      .join(', ');
    const headerLine = `http_headers = { ${entries} }`;

    const existingMatch = sectionSlice.match(/^http_headers\s*=.*$/m);
    if (existingMatch) {
      const lineStart = idx + sectionSlice.indexOf(existingMatch[0]);
      content =
        content.slice(0, lineStart) +
        headerLine +
        content.slice(lineStart + existingMatch[0].length);
    } else {
      const before = content.slice(0, sectionEnd).trimEnd();
      const after = content.slice(sectionEnd);
      content = before + '\n' + headerLine + '\n' + after;
    }

    writeFileSync(configPath, content, 'utf-8');
  } catch {
    // Config may not exist yet if `codex mcp add` failed; MCP still works without custom headers
  }
}
