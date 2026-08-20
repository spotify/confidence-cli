import type { OnboardingGoal } from '@lib/session.js';
import type { PromptOption } from '../../components/PromptPanel.js';

const BASE_GOALS: PromptOption<OnboardingGoal>[] = [
  { label: 'Feature Flags', value: 'feature-flags' },
  { label: 'Event Tracking', value: 'event-tracking' },
];

const RECORDINGS_GOAL: PromptOption<OnboardingGoal> = {
  label: 'Session Recordings (β)',
  value: 'session-recordings',
};

const GOAL_OPTIONS = [...BASE_GOALS, RECORDINGS_GOAL];

export function goalOptionsFor(recordingAvailable: boolean): PromptOption<OnboardingGoal>[] {
  return recordingAvailable ? GOAL_OPTIONS : BASE_GOALS;
}

export function goalLabel(goal: OnboardingGoal): string {
  return GOAL_OPTIONS.find((o) => o.value === goal)?.label ?? goal;
}
