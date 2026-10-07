import { readJsonConfig, readOrCreateJsonConfig, writeJsonConfig } from './json-config.js';

export function writeMcpEntry(configPath: string, serverName: string, entry: unknown): void {
  const config = readOrCreateJsonConfig(configPath);

  const mcpServers = (config.mcpServers ?? {}) as Record<string, unknown>;
  mcpServers[serverName] = entry;
  config.mcpServers = mcpServers;

  writeJsonConfig(configPath, config);
}

export function removeMcpEntry(configPath: string, serverName: string): void {
  const config = readJsonConfig(configPath);
  if (!config) return;

  const mcpServers = (config.mcpServers ?? {}) as Record<string, unknown>;
  delete mcpServers[serverName];
  config.mcpServers = mcpServers;

  writeJsonConfig(configPath, config);
}
