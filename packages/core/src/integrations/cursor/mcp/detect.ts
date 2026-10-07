import { type McpStatusMap, detectMcpStatuses as detectShared } from '../../mcp/servers.js';
import { getRegisteredMcpNames, getStoredAuthToken } from '../../mcp/config.js';
import { globalConfigPath } from '../paths.js';

export function detectMcpStatuses(_projectDir: string): Promise<McpStatusMap> {
  const configPath = globalConfigPath();
  return detectShared({
    getRegisteredNames: () => getRegisteredMcpNames(configPath),
    getAuthToken: (name) => getStoredAuthToken(configPath, name),
  });
}
