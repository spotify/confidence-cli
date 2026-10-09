import type { OnboardingGoal } from '@spotify-confidence/shared-kernel';
import { BROWSER_PLATFORMS } from '@spotify-confidence/core';

export function isRecordingAvailable(framework: string | null): boolean {
  return !!framework && BROWSER_PLATFORMS.has(framework);
}

export function hasIncompatibleFramework(
  goals: OnboardingGoal[],
  framework: string | null,
): boolean {
  return goals.includes('session-recordings') && !isRecordingAvailable(framework);
}
