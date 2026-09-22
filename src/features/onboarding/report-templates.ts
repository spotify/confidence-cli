import type { OnboardingGoal } from '@shared-kernel/types.js';

export type ReportTemplate = { start: string; end: string };

export function buildReportTemplate(goals: OnboardingGoal[]): ReportTemplate {
  return { start: buildTemplateStart(goals), end: buildTemplateEnd(goals) };
}

function buildTemplateStart(goals: OnboardingGoal[]): string {
  const tableRowEntries: string[] = [];
  const dependencyEntries: string[] = [];
  const fileChangeEntries = [
    '- `<.env file>` — added `CONFIDENCE_CLIENT_SECRET`',
    '- `<entry point file>` — added SDK initialization',
  ];

  const withFlags = goals.includes('feature-flags');
  const withRecordings = goals.includes('session-recordings');

  if (withFlags || withRecordings) {
    tableRowEntries.push('| Client | <CLIENT_NAME> |');
  }

  if (withFlags) {
    tableRowEntries.push(
      '| Flag | <FLAG_NAME> |',
      '| Variants | <VARIANT_LIST> |',
      '| Default | <DEFAULT_VARIANT> (100% allocation) |',
    );
    fileChangeEntries.push('- `<aha target file>` — added flag evaluation');
    dependencyEntries.push('- `<feature flags SDK package name>`');
  }

  if (withRecordings) {
    tableRowEntries.push(
      '| Recording policy | <POLICY_NAME> |',
      '| Targeting key | <TARGETING_KEY> |',
    );
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

function buildTemplateEnd(goals: OnboardingGoal[]): string {
  const usageEntries = ['- Manage your setup at https://app.confidence.spotify.com'];
  const checklistEntries = [
    '- [ ] Check that `.env` is in `.gitignore` (so the secret stays out of git)',
    '- [ ] Add `CONFIDENCE_CLIENT_SECRET` to your CI/staging/prod environment',
  ];
  const undoEntries = ['- Revert the changed files (`git checkout` / `git stash`)'];

  if (goals.includes('feature-flags')) {
    usageEntries.push('- Flags stay on their default variant until you change them in Confidence');
    undoEntries.push('- Archive the flag in the Confidence UI');
  }

  if (goals.includes('session-recordings')) {
    usageEntries.push(
      '- The recording rule is enabled — sessions are captured once the app runs with the client secret',
      '- Recordings show up under **Recordings** in the Confidence UI',
    );
    checklistEntries.push('- [ ] Run the app and confirm a session appears under **Recordings**');
    undoEntries.push(
      '- Disable the recording rule or archive the recording policy in the Confidence UI',
    );
  }

  if (goals.includes('event-tracking')) {
    usageEntries.push('- Events are sent once the app runs with the client secret');
    checklistEntries.push('- [ ] Run the app and confirm events appear in Confidence');
    undoEntries.push('- Archive generated event definitions in the Confidence UI (if applicable)');
  }

  if (goals.includes('feature-flags') || goals.includes('session-recordings')) {
    checklistEntries.push(
      '- [ ] Verify the evaluation context supplies a stable value for the selected targeting key',
    );
  }

  if (goals.includes('feature-flags')) {
    checklistEntries.push('- [ ] Confirm flags still resolve to their intended default variants');
  }

  checklistEntries.push('- [ ] Review the diff — make sure nothing unexpected was modified');

  return `\
## How to use it

${usageEntries.join('\n')}

## Before you merge

${checklistEntries.join('\n')}

## Next steps

- [Manage your setup](https://app.confidence.spotify.com)
- [SDK reference](<link from docs MCP for detected platform>)
- Set up a data warehouse → \`/setup-warehouse\`
- Migrate flags from another provider → \`/migrate-<provider>\` (e.g. \`/migrate-statsig\`, \`/migrate-eppo\`)
- Preview and create metrics → \`/confidence:explore-metric\`
- Invite your team → \`/onboard-confidence invite-user\`
- Run an A/B experiment → \`/onboard-confidence learn\`

## To undo everything

${undoEntries.join('\n')}
\`\`\``;
}
