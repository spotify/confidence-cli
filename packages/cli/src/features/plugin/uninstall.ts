import ora from 'ora';
import type { IdeId, PluginScope } from '@spotify-confidence/shared-kernel';
import { getIntegration, uninstallPlugin } from '@spotify-confidence/core';

export async function uninstallPluginForIde(
  ideId: IdeId,
  projectDir: string,
  scope?: PluginScope,
): Promise<void> {
  const integration = getIntegration(ideId);
  const spinner = ora(`Uninstalling Confidence plugin from ${integration.name}…`).start();

  try {
    await uninstallPlugin(ideId, projectDir, scope);
    spinner.succeed(`Confidence plugin removed from ${integration.name}`);
  } catch (err) {
    spinner.fail();
    throw err;
  }
}
