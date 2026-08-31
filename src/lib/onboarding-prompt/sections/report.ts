import type { OnboardingGoal } from '../../session.js';
import { CONFIDENCE_DOCS_URL } from '../../constants.js';
import { buildReportTemplate } from '../report-templates.js';
import { loadStep } from '../steps/load.js';

const HOW_TO_RUN = `
## How to run

<exact commands to run the sample app>
`;

function buildSkillsNote(hasProviders: boolean): string {
  const examples = hasProviders
    ? '`/setup-warehouse` or `/migrate-<provider>`'
    : '`/setup-warehouse`';

  return `
> **Tip:** We left a set of Confidence skills for your AI coding assistant. Use the slash commands above (like ${examples}) to continue setting up your project with guided help.`;
}

export function generateReport({
  step,
  isEmptyProject,
  goals = ['feature-flags'],
  hasProviders = false,
}: {
  step: number;
  isEmptyProject: boolean;
  goals?: OnboardingGoal[];
  hasProviders?: boolean;
}): string {
  const template = buildReportTemplate(goals);

  return loadStep('generate-report.md', {
    STEP: step,
    REPORT_START: template.start,
    HOW_TO_RUN: isEmptyProject ? HOW_TO_RUN : '',
    REPORT_END: template.end,
    SKILLS_NOTE: buildSkillsNote(hasProviders),
    DOCS_URL: CONFIDENCE_DOCS_URL,
  });
}
