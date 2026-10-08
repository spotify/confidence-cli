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
  return Object.entries(config.projects ?? {})
    .map(([rawKey, project]) => [normalize(rawKey), project] as const)
    .reduce<Record<string, ClaudeProjectConfig>>(
      (acc, [normalizedKey, project]) => ({ ...acc, [normalizedKey]: project }),
      {},
    );
}

function readProjectMcpServers(projectDir: string): Record<string, McpServerEntry> {
  try {
    const resolved = realpathSync(projectDir);
    const gitRoot = resolveGitRoot(resolved);
    const config = JSON.parse(readFileSync(globalConfigPath(), 'utf-8')) as ClaudeGlobalConfig;
    const projects = normalizedProjects(config);

    return (
      projects[resolved]?.mcpServers ??
      projects[normalize(projectDir)]?.mcpServers ??
      (gitRoot ? projects[gitRoot]?.mcpServers : undefined) ??
      {}
    );
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
