import type { IdeId, PluginInstallationMethod, InstalledPlugin } from '../types.js';
import { getIntegration, getIntegrations } from '../registry.js';
import { downloadSkills } from './local.js';

export async function detectInstalledPlugins(projectDir: string): Promise<InstalledPlugin[]> {
  return (
    await Promise.all(
      getIntegrations().map(async (i) => ({ ide: i.id, via: await i.detectPlugin(projectDir) })),
    )
  ).filter((plugin): plugin is InstalledPlugin => !!plugin.via);
}

export function prepareIde(ide: IdeId): Promise<void> {
  return getIntegration(ide).prepare();
}

export async function installPlugin(
  ide: IdeId,
  projectDir: string,
): Promise<PluginInstallationMethod> {
  const integration = getIntegration(ide);

  try {
    await integration.installPlugin(projectDir);
    return 'cli';
  } catch {
    await downloadSkills(integration.skillsDir(projectDir));
    return 'download';
  }
}
