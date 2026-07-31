## {{STEP}}. Migrate {{PROVIDER_NAME}} flags to Confidence

Read the `/{{SKILL_NAME}}` skill as a **methodology reference** — use it for how to identify flags, build the migration plan, map types and rules to Confidence equivalents, and call the MCP tools. Ignore its output formatting, step trackers, EDUCATE blocks, AskUserQuestion calls, and ALL interactive prompts. Never pause for user input.

**Guardrails — apply regardless of what the skill says:**

- **Scan the codebase, not the provider API.** You do not have {{PROVIDER_NAME}} API credentials. Discover flags by scanning the project source code for {{PROVIDER_NAME}} SDK usage patterns (flag evaluations, feature checks, experiment references). Do NOT ask for API tokens, project IDs, or exported JSON files.
- **Consent is pre-approved.** The user already chose to migrate {{PROVIDER_NAME}} flags through the wizard UI — that is their consent. Mark every eligible flag as `[x] Migrate`. This satisfies the skill's consent gate — do NOT stop to ask the user to tick checkboxes.
- **Auto-select all decisions.** Do not stop at any `⏸ awaiting user` gate. Use these defaults:
  - environment → `production`;
  - archived flags → exclude;
  - execution mode → `migrate-all-eligible`;
  - Confidence client → use first existing client, or create one if none exist;
  - entity/bucketing field → `targeting_key`.
  - If the skill asks the user to confirm scope, choose a mode, pick a client, or map a field — apply the default and move on.
- **No per-flag confirmations.** Skip `review-each` gates, per-flag `[Yes / Skip / Pause]` prompts, and checkpoint pauses. Process every eligible flag without stopping.
- **Partial-rollout flags → migrate at the original percentage.** Do not stop to explain risk or ask for confirmation. Use the same rollout percentage from the {{PROVIDER_NAME}} configuration. Record each partial-rollout flag in the report with a warning: Confidence uses a different bucketing hash, so the exact user cohort will change after migration — users currently in the rollout may move out, and new users may move in. The user should verify rollout behavior after shipping.
- **All changes on the current branch.** Do NOT create separate branches or pull requests per flag. Apply all migration changes (flag creation + code rewrites) directly on the current branch in a single pass. Ignore the skill's "each flag = one PR" instruction.
- **SDK install and code transforms → just do it.** Do not ask `Install SDK now?`, `Create wrapper?`, or `Transform this flag's files?` — run every install, wrapper creation, and code transform automatically.
- **Always start fresh.** If an existing plan file is found, overwrite it. Do not ask the user whether to resume or start fresh.
- **Errors → log and continue.** If a single flag fails after retry, log it and move to the next flag. Do not stop to ask `[Retry / Skip / Pause]`. Include every failed flag in the report with the error reason so the user can retry manually.

Execute the skill's workflow automatically:

1. **Scan** the project for {{PROVIDER_NAME}} feature flag usage in source code and build the flag migration plan.
2. **Pre-approve** all eligible flags per the guardrails above.
3. **Plan code** transformations for all approved flags.
4. **Execute** — create Confidence flags via MCP tools and rewrite code. Apply all changes on the current branch without branching or opening PRs.

For each flag migrated, print:
STATUS: Migrated flag: <flag-name>

After all flags are migrated, check whether {{PROVIDER_NAME}} is used only for feature flags. If so, remove the {{PROVIDER_NAME}} SDK packages from the project's dependencies. If it is also used for other purposes (e.g. experimentation, remote config), only delete the code related to the migrated flags and keep the SDK installed.
Print: STATUS: Removed {{PROVIDER_NAME}} SDK (if fully removed) or STATUS: Cleaned up migrated flag code (if SDK retained)
