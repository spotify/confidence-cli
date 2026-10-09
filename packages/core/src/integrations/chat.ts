import type { IdeId } from '@spotify-confidence/shared-kernel';
import type { WizardSession } from '../session/session.js';
import { getIntegration } from './registry.js';
import { SKILL_NAMES, skillInvocation } from './skills/index.js';

function buildChatPrompt(session: WizardSession, ide: IdeId): string {
  const lines =
    session.codeChanges.length <= 0
      ? [`I'd like to integrate Confidence into this project.`]
      : [
          `I just set up Confidence in this project using the quickstart wizard.`,
          'Changes made:',
          ...session.codeChanges.map((change) => `- ${change}`),
        ];

  if (session.reportFile) {
    lines.push('', `A detailed report is in ${session.reportFile}.`);
  }

  if (session.connectedMcps.length === 0) {
    lines.push(
      '',
      "Note: I don't have Confidence MCP tools connected. Please fetch the latest Confidence docs from https://confidence.spotify.com/docs when you need SDK references or integration guides.",
    );
  }

  if (session.codeChanges.length > 0) {
    lines.push(
      'Help me with next steps — creating feature flags, adding targeting rules, setting up experiments, etc.',
    );

    if (session.pluginTargets.length) {
      const skills = SKILL_NAMES.map((name) => `\`${skillInvocation(name, ide)}\``).join(', ');
      lines.push(
        `The Confidence AI plugin is installed with the following skills: ${skills}.`,
        'Use these skills for Confidence-related tasks like setting up a data warehouse, migrating from other providers, or instrumenting events.',
      );
    }
  }

  return lines.join('\n');
}

export function launchChatSession(session: WizardSession, ide: IdeId): void {
  const integration = getIntegration(ide);
  integration.launchChat({
    systemPrompt: buildChatPrompt(session, ide),
    cwd: session.projectDir,
    token: session.authState.token,
  });
}
