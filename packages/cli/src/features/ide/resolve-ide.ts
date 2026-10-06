import select from '@inquirer/select';
import type { IdeId } from '@spotify-confidence/shared-kernel';
import {
  getConfigValue,
  setConfigValue,
  getIntegrations,
  isInteractive,
} from '@spotify-confidence/core';

const VALID_IDE_IDS = new Set<IdeId>(['claude', 'cursor', 'codex']);
const VALID_IDE_LIST = [...VALID_IDE_IDS].join(', ');

export async function resolveIde(explicit?: string): Promise<IdeId> {
  if (explicit) return validateIdeId(explicit);

  const saved = getConfigValue('ide') as string | undefined;
  if (saved) return validateIdeId(saved);

  return promptForIde();
}

function validateIdeId(value: string): IdeId {
  if (!VALID_IDE_IDS.has(value as IdeId)) {
    throw new Error(`Unsupported IDE "${value}". Valid options: ${VALID_IDE_LIST}`);
  }
  return value as IdeId;
}

async function promptForIde(): Promise<IdeId> {
  if (!isInteractive()) {
    throw new Error(`No IDE configured. Pass --ide (${VALID_IDE_LIST}) or run interactively.`);
  }

  const integrations = getIntegrations();
  const chosen = await select({
    message: 'Which AI coding agent are you using?',
    choices: integrations.map((i) => ({ name: i.name, value: i.id })),
  });

  setConfigValue('ide', chosen);

  return chosen;
}
