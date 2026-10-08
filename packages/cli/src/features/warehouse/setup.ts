import { getIntegration, PLUGIN_NAME } from '@spotify-confidence/core';
import { fail } from '@output/print.js';
import { resolveIde, resolveFlag, resolveProjectDir } from '@features/ide/index.js';
import { resolveAuthToken } from '@features/mcp/index.js';

const WAREHOUSE_SKILLS: Record<string, string> = {
  bigquery: 'setup-warehouse-bigquery',
  snowflake: 'setup-warehouse-snowflake',
  databricks: 'setup-warehouse-databricks',
  redshift: 'setup-warehouse-redshift',
};

function buildSetupPrompt(warehouseType: string): string {
  const skill = WAREHOUSE_SKILLS[warehouseType];
  return `Set up a ${warehouseType} data warehouse for Confidence experimentation analytics.
Use the "${skill}" skill from the ${PLUGIN_NAME} plugin to guide the setup process.
Follow the skill instructions step by step — collect configuration, validate, create the warehouse, set up connectors, and verify the pipeline.`;
}

export async function runWarehouseSetup(argv: Record<string, unknown>): Promise<void> {
  const warehouseType = argv['warehouse-type'] as string;
  if (!WAREHOUSE_SKILLS[warehouseType]) {
    fail(`Unknown warehouse type: ${warehouseType}`);
    return;
  }

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

  integration.launchChat({ userPrompt: buildSetupPrompt(warehouseType), cwd: projectDir, token });
}
