import type { OnboardingGoal } from '../session.js';
import { CONFIDENCE_DOCS_URL } from '../constants.js';
import { buildReportTemplate } from './report-templates.js';
import { loadStep } from './steps/load.js';

const HOW_TO_RUN = `
## How to run

<exact commands to run the sample app>
`;

const SKILLS_NOTE = `
> **Tip:** We left a set of Confidence skills for your AI coding assistant. Use the slash commands above (like \`/setup-warehouse\`) to continue setting up your project with guided help.`;

export function generateReport({
  step,
  isEmptyProject,
  goal = 'feature-flags',
  hasPlugins = false,
}: {
  step: number;
  isEmptyProject: boolean;
  goal?: OnboardingGoal;
  hasPlugins?: boolean;
}): string {
  const template = buildReportTemplate(goal);

  return loadStep('generate-report.md', {
    STEP: step,
    REPORT_START: template.start,
    HOW_TO_RUN: isEmptyProject ? HOW_TO_RUN : '',
    REPORT_END: template.end,
    SKILLS_NOTE: hasPlugins ? SKILLS_NOTE : '',
    DOCS_URL: CONFIDENCE_DOCS_URL,
  });
}

export function summary(step: number): string {
  return loadStep('summary.md', { STEP: step });
}

export function rules(): string {
  return loadStep('rules.md');
}
