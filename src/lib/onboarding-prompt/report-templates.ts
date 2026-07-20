import type { OnboardingGoal } from '../session.js';

export type ReportTemplate = { start: string; end: string };

export function buildReportTemplate(goal: OnboardingGoal): ReportTemplate {
  switch (goal) {
    case 'feature-flags':
      return { start: FLAGS_TEMPLATE_START, end: COMMON_TEMPLATE_END };

    case 'session-recording':
      return { start: RECORDING_TEMPLATE_START, end: COMMON_TEMPLATE_END };

    case 'all':
      return { start: ALL_TEMPLATE_START, end: COMMON_TEMPLATE_END };

    default: {
      const _exhaustive: never = goal satisfies never;
      throw new Error(`Unhandled goal: ${_exhaustive}`);
    }
  }
}

const FLAGS_TEMPLATE_START = `\
\`\`\`markdown
# Confidence Quickstart Report

## What was created in Confidence

| | |
|---|---|
| Client | <CLIENT_NAME> |
| Flag | <FLAG_NAME> |
| Variants | <VARIANT_LIST> |
| Default | <DEFAULT_VARIANT> (100% allocation) |

## What changed in your codebase

**New/modified files:**

- \`<.env file>\` — added \`CONFIDENCE_CLIENT_SECRET\`
- \`<entry point file>\` — added SDK initialization
- \`<aha target file>\` — added flag evaluation
<!-- Only list files that were actually created or modified -->

**New dependencies:**

- \`<SDK package name>\``;

const RECORDING_TEMPLATE_START = `\
\`\`\`markdown
# Confidence Quickstart Report

## What was set up

| | |
|---|---|
| Integration | Session Recording |
| Client | <CLIENT_NAME> |

## What changed in your codebase

**New/modified files:**

- \`<.env file>\` — added \`CONFIDENCE_CLIENT_SECRET\`
- \`<entry point file>\` — added session recording provider
<!-- Only list files that were actually created or modified -->

**New dependencies:**

- \`<session recording SDK package name>\``;

const ALL_TEMPLATE_START = `\
\`\`\`markdown
# Confidence Quickstart Report

## What was created in Confidence

| | |
|---|---|
| Client | <CLIENT_NAME> |
| Flag | <FLAG_NAME> |
| Variants | <VARIANT_LIST> |
| Default | <DEFAULT_VARIANT> (100% allocation) |
| Session Recording | Enabled |

## What changed in your codebase

**New/modified files:**

- \`<.env file>\` — added \`CONFIDENCE_CLIENT_SECRET\`
- \`<entry point file>\` — added SDK initialization and session recording provider
- \`<aha target file>\` — added flag evaluation
<!-- Only list files that were actually created or modified -->

**New dependencies:**

- \`<feature flags SDK package name>\`
- \`<session recording SDK package name>\``;

const COMMON_TEMPLATE_END = `\
## How to use it

- Manage your setup at https://app.confidence.spotify.com
- The default configuration is safe to merge — nothing changes until you flip a flag or enable recording

## Before you merge

- [ ] Check that \`.env\` is in \`.gitignore\` (so the secret stays out of git)
- [ ] Add \`CONFIDENCE_CLIENT_SECRET\` to your CI/staging/prod environment
- [ ] Verify the evaluation context sets a stable \`targeting_key\` for consistent variant assignment
- [ ] Run the app locally and confirm the default behavior is unchanged
- [ ] Review the diff — make sure nothing unexpected was modified

## Next steps

- [Manage your setup](https://app.confidence.spotify.com)
- [SDK reference](<link from docs MCP for detected platform>)
- Set up a data warehouse → \`/setup-warehouse\`
- Invite your team → \`/onboard-confidence invite-user\`
- Run an A/B experiment → \`/onboard-confidence learn\`

## To undo everything

- Revert the changed files (\`git checkout\` / \`git stash\`)
- Archive the flag in the Confidence UI (if applicable)
\`\`\``;
