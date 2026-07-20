import type { OnboardingGoal } from '@lib/session.js';

const GOAL_LABELS: Record<OnboardingGoal, string> = {
  'feature-flags': 'Feature Flags',
  'session-recording': 'Session Recording (β)',
  all: 'Feature Flags & Session Recording (β)',
};

export function goalLabel(goal: OnboardingGoal): string {
  return GOAL_LABELS[goal];
}

const BROWSER_FRAMEWORKS = new Set(['react', 'nextjs', 'javascript', 'typescript']);

export function supportsSessionRecording(framework: string | null): boolean {
  if (framework === null) return true;
  return BROWSER_FRAMEWORKS.has(framework);
}
