import type { IdeId } from '@spotify-confidence/shared-kernel';

export { skillInvocation, referenceInstruction, followInstruction } from '@spotify-confidence/core';

type ToolFormatter = (server: string, tool: string) => string;

const TOOL_FORMATTERS: Record<IdeId, ToolFormatter> = {
  claude: (server, tool) => `mcp__${server}__${tool}`,
  codex: (server, tool) => `${server}:${tool}`,
  cursor: (server, tool) => `mcp__${server}__${tool}`,
};

export function buildToolVars(ide: IdeId): Record<string, string> {
  const fmt = TOOL_FORMATTERS[ide];
  const flags = (tool: string) => fmt('confidence-flags', tool);
  const docs = (tool: string) => fmt('confidence-docs', tool);

  return {
    FLAGS_getIdentityInfo: flags('getIdentityInfo'),
    FLAGS_listClients: flags('listClients'),
    FLAGS_createClient: flags('createClient'),
    FLAGS_getClientSecret: flags('getClientSecret'),
    FLAGS_getContextSchema: flags('getContextSchema'),
    FLAGS_addContextField: flags('addContextField'),
    FLAGS_listFlags: flags('listFlags'),
    FLAGS_createFlag: flags('createFlag'),
    FLAGS_addTargetingRule: flags('addTargetingRule'),
    FLAGS_resolveFlag: flags('resolveFlag'),
    FLAGS_listRecordingPolicies: flags('listRecordingPolicies'),
    FLAGS_createRecordingPolicy: flags('createRecordingPolicy'),
    FLAGS_getRecordingPolicy: flags('getRecordingPolicy'),
    FLAGS_addRecordingRule: flags('addRecordingRule'),
    FLAGS_setRecordingRuleEnabled: flags('setRecordingRuleEnabled'),
    DOCS_searchDocumentation: docs('searchDocumentation'),
  };
}
