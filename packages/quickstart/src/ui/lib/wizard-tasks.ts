import type { TaskItem } from '../components/TaskList.js';

const WIZARD_STEPS = {
  systemCheck: 'Check system',
  authenticate: 'Sign in to Confidence',
  installPlugins: 'Set up your agent',
  connectTools: 'Connect tools',
  onboardProject: 'Onboard project',
} as const;

const STEP_ORDER = Object.keys(WIZARD_STEPS) as WizardStep[];

export type WizardStep = keyof typeof WIZARD_STEPS;

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
