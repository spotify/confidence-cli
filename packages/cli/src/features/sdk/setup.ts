import { getIntegration } from '@spotify-confidence/core';
import { fail } from '@output/print.js';
import { resolveIde, resolveFlag, resolveProjectDir } from '@features/ide/index.js';
import { resolveAuthToken } from '@features/mcp/index.js';

function buildSdkSetupPrompt(): string {
  return `Set up the Confidence SDK in this project.

Use the "analyze-project" skill from the Confidence plugin to determine the correct SDK
for this project, install it, and create a working configuration file.

Only set up the SDK — do not create feature flags, event tracking, or session recordings.

Use the Confidence MCP tools for SDK references and best practices.`;
}

export async function runSdkSetup(argv: Record<string, unknown>): Promise<void> {
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
  if (!token) {
    fail('Not authenticated. Run "confidence login" to sign in.');
    return;
  }

  const prompt = buildSdkSetupPrompt();
  integration.launchChat({ prompt, cwd: projectDir, token });
}
