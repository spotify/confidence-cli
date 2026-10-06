import ora from 'ora';
import type { IdeId } from '@spotify-confidence/shared-kernel';
import { getIntegration, installPlugin } from '@spotify-confidence/core';

export async function installPluginForIde(ideId: IdeId, projectDir: string): Promise<void> {
  const integration = getIntegration(ideId);
  const spinner = ora(`Installing Confidence plugin for ${integration.name}…`).start();

  try {
    const method = await installPlugin(ideId, projectDir);
    spinner.succeed(`Confidence plugin installed for ${integration.name} (via ${method})`);
  } catch (err) {
    spinner.fail();
    throw err;
  }
}
