import type { ChosenIde, PluginInstallationMethod } from '@shared-kernel/types.js';
import { PLUGIN_NAME } from '@lib/constants.js';

type ToolFormatter = (server: string, tool: string) => string;

const TOOL_FORMATTERS: Record<ChosenIde, ToolFormatter> = {
  claude: (server, tool) => `mcp__${server}__${tool}`,
  codex: (server, tool) => `${server}:${tool}`,
  cursor: (server, tool) => `mcp__${server}__${tool}`,
};

const SKILL_INVOCATIONS: Record<ChosenIde, (skill: string) => string> = {
  claude: (skill) => `/${PLUGIN_NAME}:${skill}`,
  codex: (skill) => `$${skill}`,
  cursor: (skill) => `/${skill}`,
};

const SKILLS_DIRS: Record<ChosenIde, string> = {
  claude: '.claude/skills',
  cursor: '.cursor/skills',
  codex: '.agents/skills',
};

export function skillInvocation(skillName: string, ide: ChosenIde): string {
  return SKILL_INVOCATIONS[ide](skillName);
}

export function referenceInstruction(
  skillName: string,
  ide: ChosenIde,
  method?: PluginInstallationMethod | null,
): string {
  return method === 'cli'
    ? `Invoke the \`${skillInvocation(skillName, ide)}\` skill as a **methodology reference**`
    : `Read \`${SKILLS_DIRS[ide]}/${skillName}/SKILL.md\` as a **methodology reference**`;
}

export function buildToolVars(ide: ChosenIde): Record<string, string> {
  const fmt = TOOL_FORMATTERS[ide];
  const flags = (tool: string) => fmt('confidence-flags', tool);
  const docs = (tool: string) => fmt('confidence-docs', tool);

  return {
    FLAGS_getIdentityInfo: flags('getIdentityInfo'),
    FLAGS_listClients: flags('listClients'),
    FLAGS_createClient: flags('createClient'),
    FLAGS_getClientSecret: flags('getClientSecret'),
    FLAGS_listFlags: flags('listFlags'),
    FLAGS_createFlag: flags('createFlag'),
    FLAGS_addTargetingRule: flags('addTargetingRule'),
    FLAGS_resolveFlag: flags('resolveFlag'),
    DOCS_searchDocumentation: docs('searchDocumentation'),
    DOCS_getLocalResolveIntegrationGuide: docs('getLocalResolveIntegrationGuide'),
    DOCS_getCodeSnippetAndSdkIntegrationTips: docs('getCodeSnippetAndSdkIntegrationTips'),
  };
}
