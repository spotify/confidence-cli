import type { IdeId } from '@shared-kernel/types.js';
import type { WizardSession } from '@lib/session.js';
import { getIntegration } from './registry.js';

function buildChatPrompt(session: WizardSession): string {
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
      lines.push(
        'I have installed Confidence AI plugin that contains useful skills and commands for working with Confidence,',
        'e.g., `/setup-warehouse` for setting up a data warehouse',

        session.detectedProviders.length
          ? "or `/migrate-<provider>` to migrate another provider's flags to Confidence."
          : '.',
      );
    }
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
