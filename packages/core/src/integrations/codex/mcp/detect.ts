import { readFileSync } from 'node:fs';
import type { McpServerName, McpStatusMap } from '../../mcp/servers.js';
import { detectMcpStatuses as detectShared } from '../../mcp/servers.js';
import { onlyKnownServerNames } from '../../mcp/config.js';
import { globalConfigPath, projectConfigPath } from '../paths.js';

export function detectMcpStatuses(projectDir: string): Promise<McpStatusMap> {
  return detectShared({
    getRegisteredNames: () => getRegisteredMcpNames(projectDir),
    getAuthToken: (name) => getStoredAuthToken(name),
  });
}

function getRegisteredMcpNames(projectDir: string): string[] {
  const paths = [globalConfigPath(), projectConfigPath(projectDir)];

  const names = paths.flatMap((configPath) => {
    try {
      const content = readFileSync(configPath, 'utf-8');
      const matches = [...content.matchAll(/\[mcp_servers\.([^\]]+)\]/g)].map((m) => m[1]);
      return matches;
    } catch {
      return [];
    }
  });

  return onlyKnownServerNames(names);
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
