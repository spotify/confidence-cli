import type { IdeId, PluginScope } from '@spotify-confidence/shared-kernel';
import { getIntegration, getIntegrations } from '../registry.js';
import { downloadSkills, getSkillsDir, removeSkills } from './local.js';
import { cliFailed } from './telemetry.js';

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

  const [cliResult, localResult] = await Promise.allSettled([
    integration.installPlugin(projectDir, scope),
    downloadSkills(getSkillsDir()),
  ]);

  const cliOk = cliResult.status === 'fulfilled';
  const localOk = localResult.status === 'fulfilled' && localResult.value;

  if (!cliOk) cliFailed('install', ide);
  if (!cliOk && !localOk) throw cliResult.reason;
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
      cliFailed('uninstall', ide);
    }
  }

  const others = await detectInstalledPlugins(projectDir);
  if (others.length === 0) {
    await removeSkills(getSkillsDir());
  }
}

export async function updatePlugin(
  ide: IdeId,
  projectDir: string,
  scope?: PluginScope,
): Promise<void> {
  const integration = getIntegration(ide);

  const [cliResult, localResult] = await Promise.allSettled([
    integration.updatePlugin(projectDir, scope),
    downloadSkills(getSkillsDir(), true),
  ]);

  const cliOk = cliResult.status === 'fulfilled';
  const localOk = localResult.status === 'fulfilled' && localResult.value;

  if (!cliOk) cliFailed('update', ide);
  if (!cliOk && !localOk) throw cliResult.reason;
}
