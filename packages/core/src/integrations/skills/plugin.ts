import type { IdeId, PluginScope } from '@spotify-confidence/shared-kernel';
import { getIntegration, getIntegrations } from '../registry.js';
import { track } from '../../telemetry/telemetry.js';
import { downloadSkills, getSkillsDir, removeSkills } from './local.js';

export async function detectInstalledPlugins(projectDir: string): Promise<IdeId[]> {
  const results = await Promise.all(
    getIntegrations().map(async (i) => ((await i.detectPlugin(projectDir)) ? i.id : null)),
  );
  return results.filter((id): id is IdeId => id !== null);
}

export function prepareIde(ide: IdeId): Promise<void> {
  return getIntegration(ide).prepare();
}

export async function installPlugin(
  ide: IdeId,
  projectDir: string,
  scope?: PluginScope,
): Promise<void> {
  const integration = getIntegration(ide);

  try {
    await integration.installPlugin(projectDir, scope);
  } catch {
    track({ step: 'plugin.install', action: `cli-failed:${ide}`, sentiment: 'frustrated' });
  }

  await downloadSkills(getSkillsDir());
}

export async function uninstallPlugin(
  ide: IdeId,
  projectDir: string,
  scope?: PluginScope,
): Promise<void> {
  const integration = getIntegration(ide);

  if (await integration.detectPlugin(projectDir)) {
    try {
      await integration.uninstallPlugin(projectDir, scope);
    } catch {
      track({ step: 'plugin.uninstall', action: `cli-failed:${ide}`, sentiment: 'frustrated' });
    }
  }

  await removeSkills(getSkillsDir());
}

export async function updatePlugin(
  ide: IdeId,
  projectDir: string,
  scope?: PluginScope,
): Promise<void> {
  const integration = getIntegration(ide);

  try {
    await integration.updatePlugin(projectDir, scope);
  } catch {
    track({ step: 'plugin.update', action: `cli-failed:${ide}`, sentiment: 'frustrated' });
  }

  await downloadSkills(getSkillsDir(), true);
}
