import type { OnboardingGoal } from '@lib/session.js';
import type { PromptOption } from '../../components/PromptPanel.js';

export type GoalValue = OnboardingGoal | 'skip';

const GOAL_OPTIONS: PromptOption<GoalValue>[] = [
  { label: 'Feature Flags', value: 'feature-flags' },
  { label: 'Session Recordings (β)', value: 'session-recordings' },
  { label: 'YOLO! Set up everything', value: 'all' },
  { label: 'Skip setup', value: 'skip' },
];

const FLAGS_ONLY_OPTIONS: PromptOption<GoalValue>[] = GOAL_OPTIONS.filter((o) =>
  (['feature-flags', 'skip'] as GoalValue[]).includes(o.value),
);

export function goalOptionsFor(recordingAvailable: boolean): PromptOption<GoalValue>[] {
  return recordingAvailable ? GOAL_OPTIONS : FLAGS_ONLY_OPTIONS;
}

export function goalLabel(goal: OnboardingGoal): string {
  return GOAL_OPTIONS.find((o) => o.value === goal)?.label ?? goal;
}
