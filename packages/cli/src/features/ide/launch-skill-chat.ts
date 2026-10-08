import { getIntegration, hasSkills } from '@spotify-confidence/core';
import { fail } from '@output/print.js';
import { resolveIde, resolveFlag, resolveProjectDir } from '@features/ide/index.js';
import { resolveAuthToken } from '@features/mcp/index.js';

export async function launchSkillChat(
  argv: Record<string, unknown>,
  userPrompt: string,
): Promise<void> {
  const ideId = await resolveIde(resolveFlag('ide', argv));
  const projectDir = resolveProjectDir(argv);
  const integration = getIntegration(ideId);

  if (!hasSkills()) {
    fail(
      'Confidence skills not installed. Run "confidence plugin install" to install them or "confidence quickstart" to set up your project first.',
    );
    return;
  }

  const statuses = await integration.detectMcpStatuses(projectDir);
  if (Object.values(statuses).some((s) => s === 'not-installed')) {
    fail('MCP servers not installed. Run "confidence mcp install" to set them up.');
    return;
  }

  if (Object.values(statuses).some((s) => s === 'auth-expired')) {
    fail('MCP server auth expired. Run "confidence mcp auth" to re-authenticate.');
    return;
  }

  const token = await resolveAuthToken({ profile: resolveFlag('profile', argv) });
  if (!token) {
    fail('Not authenticated. Run "confidence login" to sign in.');
    return;
  }

  integration.launchChat({ userPrompt, cwd: projectDir, token });
}
