import type { ProviderConfig } from '@spotify-confidence/core';
import { getIntegration } from '@spotify-confidence/core';
import { fail } from '@output/print.js';
import { resolveIde, resolveFlag, resolveProjectDir } from '@features/ide/index.js';
import { resolveAuthToken } from '@features/mcp/index.js';
import { buildMigrationPrompt } from './prompt.js';

export async function launchMigration(
  argv: Record<string, unknown>,
  provider: ProviderConfig,
): Promise<void> {
  const ideId = await resolveIde(resolveFlag('ide', argv));
  const projectDir = resolveProjectDir(argv);
  const integration = getIntegration(ideId);

  const plugin = await integration.detectPlugin(projectDir);
  if (!plugin) {
    fail(
      'Confidence AI plugin not installed. Run "confidence plugin install" to install it or "confidence quickstart" to set up your project first.',
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
  if (!token) return;

  const prompt = buildMigrationPrompt(provider);
  integration.launchChat({ prompt, cwd: projectDir, token });
}
