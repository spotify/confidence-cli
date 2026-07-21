import { readFileSync, writeFileSync } from 'node:fs';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import type { McpConnectOpts } from '../types.js';
import {
  MCP_SERVERS,
  type McpServerName,
  type McpServerStatus,
  detectMcpStatuses as detectShared,
} from '../mcp/servers.js';
import { globalConfigPath, projectConfigPath } from './paths.js';

const execFile = promisify(execFileCb);

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
    // Not registered yet — that's fine
  }

  await execFile('codex', ['mcp', 'add', opts.serverName, '--url', opts.serverUrl]);

  const headers: Record<string, string> = { ...opts.serverHeaders };
  if (opts.accessToken) {
    headers['Authorization'] = `Bearer ${opts.accessToken}`;
  }

  patchHttpHeaders(opts.serverName, headers);
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
    return null;
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
    // Best-effort — MCP still works without the header
  }
}
