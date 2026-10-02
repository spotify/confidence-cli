## 1. Preflight

Print "STATUS: Running preflight checks..."

Check which tools are available — try each, note the result, do NOT stop on failure:

- Call `{{FLAGS_getIdentityInfo}}` (no args). If it returns a valid identity: flag management is available. Otherwise: note it and continue — later steps will use placeholders.
- Call `{{DOCS_searchDocumentation}}` with query "SDK integration". Note whether it succeeds — docs MCP is a **fallback** for details not covered by the skill. Do NOT use it as the primary SDK guide; the skill is the primary source.

Continue regardless of results.
