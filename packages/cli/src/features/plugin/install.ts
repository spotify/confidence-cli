import ora from 'ora';
import type { IdeId, PluginScope } from '@spotify-confidence/shared-kernel';
import { getIntegration, installPlugin } from '@spotify-confidence/core';

export async function installPluginForIde(
  ideId: IdeId,
  projectDir: string,
  scope?: PluginScope,
): Promise<void> {
  const integration = getIntegration(ideId);
  const spinner = ora(`Installing Confidence plugin for ${integration.name}…`).start();

  try {
    const method = await installPlugin(ideId, projectDir, scope);
    spinner.succeed(`Confidence plugin installed for ${integration.name} (via ${method})`);
  } catch (err) {
    spinner.fail();
    throw err;
  }
}
