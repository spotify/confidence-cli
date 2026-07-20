import type { IdeId } from './types.js';
import type { IdeIntegration } from './types.js';
import { claudeIntegration } from './claude/index.js';
import { cursorIntegration } from './cursor/index.js';
import { codexIntegration } from './codex/index.js';

const INTEGRATIONS: IdeIntegration[] = [claudeIntegration, cursorIntegration, codexIntegration];

export function getIntegrations(): IdeIntegration[] {
  return INTEGRATIONS;
}

export function getIntegration(id: IdeId): IdeIntegration {
  const integration = INTEGRATIONS.find((i) => i.id === id);
  if (!integration) throw new Error(`Unknown IDE: ${id}`);
  return integration;
}
