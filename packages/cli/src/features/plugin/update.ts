import ora from 'ora';
import type { IdeId } from '@spotify-confidence/shared-kernel';
import { getIntegration, updatePlugin } from '@spotify-confidence/core';

export async function updatePluginForIde(ideId: IdeId, projectDir: string): Promise<void> {
  const integration = getIntegration(ideId);
  const spinner = ora(`Updating Confidence plugin for ${integration.name}…`).start();

  try {
    const method = await updatePlugin(ideId, projectDir);
    spinner.succeed(`Confidence plugin updated for ${integration.name} (via ${method})`);
  } catch (err) {
    spinner.fail();
    throw err;
  }
}
