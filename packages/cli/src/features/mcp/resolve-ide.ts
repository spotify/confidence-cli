import select from '@inquirer/select';
import type { IdeId } from '@spotify-confidence/shared-kernel';
import { getConfigValue, setConfigValue, getIntegrations } from '@spotify-confidence/core';

export async function resolveIde(): Promise<IdeId> {
  const saved = getConfigValue('ide') as IdeId | undefined;
  if (saved) return saved;

  const integrations = getIntegrations();
  const chosen = await select({
    message: 'Which AI coding agent are you using?',
    choices: integrations.map((i) => ({ name: i.name, value: i.id })),
  });

  setConfigValue('ide', chosen);

  return chosen;
}
