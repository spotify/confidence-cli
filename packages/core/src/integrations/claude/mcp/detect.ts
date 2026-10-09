import { realpathSync, readFileSync } from 'node:fs';
import { normalize } from 'node:path';
import { resolveGitRoot } from '../../../system/fs.js';
import { onlyKnownServerNames } from '../../mcp/config.js';
import {
  type McpServerName,
  type McpStatusMap,
  detectMcpStatuses as detectShared,
} from '../../mcp/servers.js';
import { globalConfigPath } from '../paths.js';

type McpServerEntry = { headers?: Record<string, string> };
type ClaudeProjectConfig = { mcpServers?: Record<string, McpServerEntry> };
type ClaudeGlobalConfig = { projects?: Record<string, ClaudeProjectConfig> };

function normalizedProjects(config: ClaudeGlobalConfig): Record<string, ClaudeProjectConfig> {
  return Object.fromEntries(
    Object.entries(config.projects ?? {}).map(([rawKey, project]) => [normalize(rawKey), project]),
  );
}

function readProjectMcpServers(projectDir: string): Record<string, McpServerEntry> {
  try {
    const resolved = realpathSync(projectDir);
    const config = JSON.parse(readFileSync(globalConfigPath(), 'utf-8')) as ClaudeGlobalConfig;
    const projects = normalizedProjects(config);

    const byResolved =
      projects[resolved]?.mcpServers ?? projects[normalize(projectDir)]?.mcpServers;
    if (byResolved) return byResolved;

    const gitRoot = resolveGitRoot(resolved);
    return (gitRoot ? projects[gitRoot]?.mcpServers : undefined) ?? {};
  } catch {
    return {};
  }
}

function getLocalScopeMcpNames(projectDir: string): string[] {
  return onlyKnownServerNames(Object.keys(readProjectMcpServers(projectDir)));
}

function getLocalScopeAuthToken(projectDir: string, serverName: McpServerName): string | null {
  const bearer = readProjectMcpServers(projectDir)[serverName]?.headers?.['Authorization'];
  return bearer?.startsWith('Bearer ') ? bearer.slice(7) : null;
}

export function detectMcpStatuses(projectDir: string): Promise<McpStatusMap> {
  return detectShared({
    getRegisteredNames: () => getLocalScopeMcpNames(projectDir),
    getAuthToken: (name) => getLocalScopeAuthToken(projectDir, name),
  });
}
