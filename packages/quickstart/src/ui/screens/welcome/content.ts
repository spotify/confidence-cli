import type { OnboardingGoal } from '@spotify-confidence/shared-kernel';
import type { WizardSession } from '@spotify-confidence/core';
import { capitalize, conjoin } from '@spotify-confidence/core';

const GOAL_NAMES: Record<OnboardingGoal, string> = {
  'feature-flags': 'feature flags',
  'event-tracking': 'event tracking',
  'session-recordings': 'session recordings',
};

function goalList(goals: OnboardingGoal[]): string {
  return conjoin(goals.map((g) => GOAL_NAMES[g]));
}

const DEFAULT_TAGLINE = 'Feature flags and experiments, set up with AI in minutes.';
const DEFAULT_INTRO = 'This wizard will help you get started with Confidence.';

const DEFAULT_STEPS = [
  'It will check your system',
  'Sign you in to Confidence workspace',
  'Teach your AI agent about Confidence',
  'Integrate the SDK into your project',
  'Show a working feature flag example',
] as const;

export function tagline(session: WizardSession): string {
  if (!session.goalsPreset) return DEFAULT_TAGLINE;
  return `${capitalize(goalList(session.onboardingGoals))}, set up with AI in minutes.`;
}

export function intro(session: WizardSession): string {
  if (!session.goalsPreset) return DEFAULT_INTRO;
  return `This wizard will set up ${goalList(session.onboardingGoals)} in your project.`;
}

export function steps(session: WizardSession): readonly string[] {
  if (!session.goalsPreset) return DEFAULT_STEPS;
  const goals = session.onboardingGoals;
  const common = DEFAULT_STEPS.slice(0, 4);
  const withFlags = goals.includes('feature-flags');
  const others = goals.filter((g) => g !== 'feature-flags');

  const tail: string[] = [];
  if (withFlags) tail.push(DEFAULT_STEPS[4]);
  if (others.length > 0) tail.push(`Set up ${goalList(others)} in your project`);

  return [...common, ...tail];
}
