## 1. Preflight

Print "STATUS: Running preflight checks..."

Check which tools are available — try each, note the result, do NOT stop on failure:

- Call `{{FLAGS_getIdentityInfo}}` (no args). If it returns a valid identity: flag management is available. Otherwise: note it and continue — later steps will use placeholders.
- Call `{{DOCS_searchDocumentation}}` with query "SDK integration". If it succeeds: use MCP docs for SDK guides. Otherwise: fall back to web search at {{DOCS_URL}}.

Continue regardless of results.
