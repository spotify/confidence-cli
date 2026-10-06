import type {
  IdeId,
  PluginInstallationMethod,
  PluginScope,
} from '@spotify-confidence/shared-kernel';
import type { InstalledPlugin } from '../types.js';
import { getIntegration, getIntegrations } from '../registry.js';
import { downloadSkills, removeSkills } from './local.js';

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
  scope?: PluginScope,
): Promise<PluginInstallationMethod> {
  const integration = getIntegration(ide);

  try {
    await integration.installPlugin(projectDir, scope);
    return 'cli';
  } catch {
    await downloadSkills(integration.skillsDir(projectDir));
    return 'download';
  }
}

export async function uninstallPlugin(
  ide: IdeId,
  projectDir: string,
  scope?: PluginScope,
): Promise<void> {
  const integration = getIntegration(ide);
  const method = await integration.detectPlugin(projectDir);

  if (method === 'cli') {
    await integration.uninstallPlugin(projectDir, scope);
  }

  await removeSkills(integration.skillsDir(projectDir));
}

export async function updatePlugin(
  ide: IdeId,
  projectDir: string,
  scope?: PluginScope,
): Promise<PluginInstallationMethod> {
  const integration = getIntegration(ide);

  try {
    await integration.updatePlugin(projectDir, scope);
    return 'cli';
  } catch {
    await downloadSkills(integration.skillsDir(projectDir), true);
    return 'download';
  }
}
