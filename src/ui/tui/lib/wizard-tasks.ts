import type { TaskItem } from '../components/TaskList.js';

const WIZARD_STEPS = {
  systemCheck: 'Check your system',
  authenticate: 'Sign in to Confidence',
  installPlugins: 'Set up your AI agent',
  connectTools: 'Connect Confidence tools',
  selectGoal: 'Choose features',
  onboardProject: 'Set up your project',
} as const;

const STEP_ORDER = Object.keys(WIZARD_STEPS) as WizardStep[];

export type WizardStep = keyof typeof WIZARD_STEPS;

/** Step titles in wizard order — shared by the welcome overview, sidebar, and screen headings. */
export const WIZARD_STEP_LABELS: readonly string[] = STEP_ORDER.map((key) => WIZARD_STEPS[key]);

export function wizardStepLabel(step: WizardStep): string {
  return WIZARD_STEPS[step];
}

export function buildWizardTasks(
  activeStep: WizardStep,
  activeStatus: TaskItem['status'],
): TaskItem[] {
  const activeIndex = STEP_ORDER.indexOf(activeStep);
  return STEP_ORDER.map((key, i) => ({
    label: WIZARD_STEPS[key],
    status: i < activeIndex ? 'done' : i === activeIndex ? activeStatus : 'pending',
  }));
}
