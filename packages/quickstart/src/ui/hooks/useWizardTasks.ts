import type { TaskItem } from '../components/TaskList.js';
import { useSession } from '../store.js';

const WIZARD_STEPS = {
  systemCheck: 'Check system',
  selectGoal: 'Select features',
  authenticate: 'Log in to Confidence',
  installPlugins: 'Set up your agent',
  connectTools: 'Connect tools',
  onboardProject: 'Onboard project',
} as const;

const STEP_ORDER = Object.keys(WIZARD_STEPS) as WizardStep[];

export type WizardStep = keyof typeof WIZARD_STEPS;

export function useWizardTasks(
  activeStep: WizardStep,
  activeStatus: TaskItem['status'],
): TaskItem[] {
  const session = useSession();
  const exclude: WizardStep[] = session.goalsPreset ? ['selectGoal'] : [];
  const activeIndex = STEP_ORDER.indexOf(activeStep);

  return STEP_ORDER.filter((key) => !exclude.includes(key)).map((key) => {
    const originalIndex = STEP_ORDER.indexOf(key);
    return {
      label: WIZARD_STEPS[key],
      status:
        originalIndex < activeIndex
          ? 'done'
          : originalIndex === activeIndex
            ? activeStatus
            : 'pending',
    };
  });
}
