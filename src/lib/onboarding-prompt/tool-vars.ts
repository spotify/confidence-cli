import type { ChosenIde } from '../session.js';

type ToolFormatter = (server: string, tool: string) => string;

const TOOL_FORMATTERS: Record<ChosenIde, ToolFormatter> = {
  claude: (server, tool) => `mcp__${server}__${tool}`,
  codex: (server, tool) => `${server}:${tool}`,
  cursor: (server, tool) => `mcp__${server}__${tool}`,
};

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
