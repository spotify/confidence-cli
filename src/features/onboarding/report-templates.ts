import type { OnboardingGoal } from '@shared-kernel/types.js';

export type ReportTemplate = { start: string; end: string };

export function buildReportTemplate(goals: OnboardingGoal[]): ReportTemplate {
  return { start: buildTemplateStart(goals), end: TEMPLATE_END };
}

function buildTemplateStart(goals: OnboardingGoal[]): string {
  const tableRowEntries: string[] = [];
  const dependencyEntries: string[] = [];
  const fileChangeEntries = [
    '- `<.env file>` — added `CONFIDENCE_CLIENT_SECRET`',
    '- `<entry point file>` — added SDK initialization',
  ];

  if (goals.includes('feature-flags')) {
    tableRowEntries.push(
      '| Client | <CLIENT_NAME> |',
      '| Flag | <FLAG_NAME> |',
      '| Variants | <VARIANT_LIST> |',
      '| Default | <DEFAULT_VARIANT> (100% allocation) |',
    );
    fileChangeEntries.push('- `<aha target file>` — added flag evaluation');
    dependencyEntries.push('- `<feature flags SDK package name>`');
  }

  if (goals.includes('session-recordings')) {
    tableRowEntries.push('| Session Recording | Enabled |');
    fileChangeEntries.push('- `<entry point file>` — added session recording provider');
    dependencyEntries.push('- `<session recording SDK package name>`');
  }

  if (goals.includes('event-tracking')) {
    tableRowEntries.push(
      '| Event Definitions | <EVENT_COUNT> created |',
      '| Fact Tables | <FACT_TABLE_COUNT> auto-created |',
    );
    fileChangeEntries.push('- `<files with track() calls>` — added event tracking calls');
    dependencyEntries.push('- `<event tracking SDK package name>`');
  }

  return `\
\`\`\`markdown
# Confidence Quickstart Report

## What was created in Confidence

| | |
|---|---|
${tableRowEntries.join('\n')}

## What changed in your codebase

**New/modified files:**

${fileChangeEntries.join('\n')}
<!-- Only list files that were actually created or modified -->

**New dependencies:**

${dependencyEntries.join('\n')}`;
}

const TEMPLATE_END = `\
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
- Migrate flags from another provider → \`/migrate-<provider>\` (e.g. \`/migrate-statsig\`, \`/migrate-eppo\`)
- Preview and create metrics → \`/confidence:explore-metric\`
- Invite your team → \`/onboard-confidence invite-user\`
- Run an A/B experiment → \`/onboard-confidence learn\`

## To undo everything

- Revert the changed files (\`git checkout\` / \`git stash\`)
- Archive the flag in the Confidence UI (if applicable)
\`\`\``;
