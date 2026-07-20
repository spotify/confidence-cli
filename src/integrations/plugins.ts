import type { IdeId } from './types.js';
import { getIntegration, getIntegrations } from './registry.js';

export function detectInstalledPlugins(projectDir: string): string[] {
  return getIntegrations()
    .filter((i) => i.detectPlugins(projectDir))
    .map((i) => i.id);
}

export function prepareIde(ide: IdeId): Promise<void> {
  return getIntegration(ide).prepare();
}

export function installPlugin(ide: IdeId, projectDir: string): Promise<void> {
  return getIntegration(ide).installPlugins(projectDir);
}
