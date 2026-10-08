import { realpathSync, readFileSync } from 'node:fs';
import type { McpStatusMap } from '../../mcp/servers.js';
import { type McpServerName, detectMcpStatuses as detectShared } from '../../mcp/servers.js';
import { onlyKnownServerNames } from '../../mcp/config.js';
import { resolveGitRoot } from '../../../system/fs.js';
import { globalConfigPath } from '../paths.js';

type McpServerEntry = {
  headers?: Record<string, string>;
};

type ClaudeProjectConfig = {
  mcpServers?: Record<string, McpServerEntry>;
};

type ClaudeGlobalConfig = {
  projects?: Record<string, ClaudeProjectConfig>;
};

function readProjectMcpServers(projectDir: string): Record<string, McpServerEntry> {
  try {
    const resolved = realpathSync(projectDir);
    const config = JSON.parse(readFileSync(globalConfigPath(), 'utf-8')) as ClaudeGlobalConfig;
    const projectGitRoot = resolveGitRoot(resolved);

    return (
      config.projects?.[resolved]?.mcpServers ??
      config.projects?.[projectDir]?.mcpServers ??
      (projectGitRoot ? config.projects?.[projectGitRoot]?.mcpServers : {}) ??
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
