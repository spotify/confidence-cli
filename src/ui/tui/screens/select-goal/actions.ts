import type { OnboardingGoal } from '@lib/session.js';
import type { PromptOption } from '../../components/PromptPanel.js';

export type GoalValue = OnboardingGoal | 'skip';

const BASE_GOAL_OPTIONS: PromptOption<GoalValue>[] = [
  { label: 'Feature Flags', value: 'feature-flags' },
  { label: 'Event Tracking', value: 'event-tracking' },
  { label: 'YOLO! Set up everything', value: 'all' },
  { label: 'Skip setup', value: 'skip' },
];

const WITH_RECORDINGS: PromptOption<GoalValue>[] = BASE_GOAL_OPTIONS.toSpliced(2, 0, {
  label: 'Session Recordings (β)',
  value: 'session-recordings',
} as PromptOption<GoalValue>);

export function goalOptionsFor(recordingAvailable: boolean): PromptOption<GoalValue>[] {
  return recordingAvailable ? WITH_RECORDINGS : BASE_GOAL_OPTIONS;
}

export function goalLabel(goal: OnboardingGoal): string {
  return BASE_GOAL_OPTIONS.find((o) => o.value === goal)?.label ?? goal;
}
