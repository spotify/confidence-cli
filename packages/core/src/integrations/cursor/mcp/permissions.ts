import { readJsonConfig, readOrCreateJsonConfig, writeJsonConfig } from './json-config.js';

export function writeCliPermission(configPath: string, serverName: string): void {
  const config = readOrCreateJsonConfig(configPath);

  const permissions = (config.permissions ?? {}) as Record<string, unknown>;
  const allow = (permissions.allow ?? []) as string[];
  const rule = `Mcp(${serverName}:*)`;

  if (!allow.includes(rule)) {
    allow.push(rule);
  }

  permissions.allow = allow;
  permissions.deny ??= [];
  config.permissions = permissions;

  writeJsonConfig(configPath, config);
}

export function removeCliPermission(configPath: string, serverName: string): void {
  const config = readJsonConfig(configPath);
  if (!config) return;

  const permissions = (config.permissions ?? {}) as Record<string, unknown>;
  const allow = (permissions.allow ?? []) as string[];
  const rule = `Mcp(${serverName}:*)`;

  permissions.allow = allow.filter((r) => r !== rule);
  config.permissions = permissions;

  writeJsonConfig(configPath, config);
}
