import { readFileSync, writeFileSync } from 'node:fs';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import type { McpConnectOpts } from '../types.js';
import {
  MCP_SERVERS,
  type McpServerName,
  type McpServerStatus,
  verifyMcpServer,
} from '../mcp/servers.js';
import { globalConfigPath, projectConfigPath } from './paths.js';

const execFile = promisify(execFileCb);

export async function detectMcpStatuses(
  projectDir: string,
): Promise<Record<McpServerName, McpServerStatus>> {
  const registered = getRegisteredMcpNames(projectDir);
  const names = Object.keys(MCP_SERVERS) as McpServerName[];

  const statuses = await Promise.all(
    names.map(async (name): Promise<[McpServerName, McpServerStatus]> => {
      if (!registered.includes(name)) return [name, 'not-installed'];
      const ok = await verifyMcpServer(name);
      return [name, ok ? 'connected' : 'installed'];
    }),
  );

  return Object.fromEntries(statuses) as Record<McpServerName, McpServerStatus>;
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
