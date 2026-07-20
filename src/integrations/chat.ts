import type { IdeId } from './types.js';
import type { WizardSession } from '@lib/session.js';
import { getIntegration } from './registry.js';

function buildChatPrompt(session: WizardSession): string {
  const lines =
    session.codeChanges.length <= 0
      ? [`I'd like to integrate Confidence into this project.`]
      : [
          `I just set up Confidence in this project using the quickstart wizard.`,
          '',
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
      '',
      "I'd like to continue working on my Confidence integration. Help me with next steps — creating feature flags, adding targeting rules, setting up experiments, or anything else I need.",
    );
  }

  return lines.join('\n');
}

export function launchChatSession(session: WizardSession, ide: IdeId): void {
  const integration = getIntegration(ide);
  integration.launchChat({
    prompt: buildChatPrompt(session),
    cwd: session.projectDir,
    token: session.authState.token,
  });
}
