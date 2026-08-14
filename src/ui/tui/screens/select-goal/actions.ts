import type { OnboardingGoal } from '@lib/session.js';
import type { PromptOption } from '../../components/PromptPanel.js';

export type GoalValue = OnboardingGoal | 'skip';

export type MigrationValue = 'skip' | 'migrate-all' | `migrate-${string}`;

type MigrationProvider = { id: string; name: string };

export function migrationOptionsFor(
  providers: MigrationProvider[],
): PromptOption<MigrationValue>[] {
  const options: PromptOption<MigrationValue>[] = [
    { label: 'Just integrate Confidence', value: 'skip' },
  ];

  if (providers.length > 1) {
    options.push({ label: 'Integrate and migrate all existing flags', value: 'migrate-all' });
  }

  for (const p of providers) {
    options.push({
      label: `Integrate and migrate ${p.name}'s flags`,
      value: `migrate-${p.id}`,
    });
  }

  return options;
}

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
