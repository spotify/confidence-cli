import type { OnboardingGoal } from '@spotify-confidence/shared-kernel';

const FEATURE_TO_GOAL: Record<string, OnboardingGoal> = {
  flags: 'feature-flags',
  events: 'event-tracking',
  recordings: 'session-recordings',
};

export function resolveGoals(features?: string[]): OnboardingGoal[] | undefined {
  if (!features) return undefined;
  if (features.includes('none')) return [];
  return features.map((f) => FEATURE_TO_GOAL[f]).filter(Boolean);
}
