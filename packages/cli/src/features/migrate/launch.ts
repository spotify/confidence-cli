import { type ProviderConfig, followInstruction } from '@spotify-confidence/core';
import { launchSkillChat } from '@features/ide/index.js';

function buildMigrationPrompt(provider: ProviderConfig) {
  const skillRef = followInstruction(provider.skillName);
  return `I want to migrate this project from ${provider.name} (${provider.id}) to Confidence.
${skillRef} — scan the codebase for ${provider.name} SDK usage, replace it with the Confidence SDK, and clean up removed dependencies.
Use the Confidence MCP tools for SDK references and flag management.`;
}

export async function launchMigration(
  argv: Record<string, unknown>,
  provider: ProviderConfig,
): Promise<void> {
  await launchSkillChat(argv, buildMigrationPrompt(provider));
}
