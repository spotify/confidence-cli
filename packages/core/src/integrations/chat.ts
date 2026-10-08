import type { IdeId } from '@spotify-confidence/shared-kernel';
import type { WizardSession } from '../session/session.js';
import { getIntegration } from './registry.js';
import { skillInvocation } from './skills/references.js';

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
      const warehouseCmd = skillInvocation('setup-warehouse', ide);
      const migrateHint = session.detectedProviders.length
        ? ` or \`${skillInvocation(`migrate-${session.detectedProviders[0].id}`, ide)}\` to migrate another provider's flags to Confidence`
        : '';
      lines.push(
        `I have installed Confidence AI plugin with skills and commands for working with Confidence,`,
        `for example \`${warehouseCmd}\` for setting up a data warehouse${migrateHint}.`,
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
