import type { OnboardingGoal } from '@spotify-confidence/shared-kernel';
import type { PromptOption } from '../../components/PromptPanel.js';

const BASE_GOALS: PromptOption<OnboardingGoal>[] = [
  { label: 'Flags', value: 'feature-flags' },
  { label: 'Events', value: 'event-tracking' },
];

const RECORDINGS_GOAL: PromptOption<OnboardingGoal> = {
  label: 'Recordings (β)',
  value: 'session-recordings',
};

const GOAL_OPTIONS = [...BASE_GOALS, RECORDINGS_GOAL];

export function goalOptionsFor(recordingAvailable: boolean): PromptOption<OnboardingGoal>[] {
  return recordingAvailable ? GOAL_OPTIONS : BASE_GOALS;
}

export function goalLabel(goal: OnboardingGoal): string {
  return GOAL_OPTIONS.find((o) => o.value === goal)?.label ?? goal;
}

export type IncompatibleAction = 'continue' | 'quit';

const QUIT_OPTION: PromptOption<IncompatibleAction> = { label: 'Quit', value: 'quit' };

export const INCOMPATIBLE_OPTIONS_WITH_FALLBACK: PromptOption<IncompatibleAction>[] = [
  { label: 'Continue without recordings', value: 'continue' },
  QUIT_OPTION,
];

export const INCOMPATIBLE_OPTIONS_QUIT_ONLY: PromptOption<IncompatibleAction>[] = [QUIT_OPTION];
