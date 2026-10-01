import type { TelemetryEvent } from '@spotify-confidence/core';

export function goalsSelected(goals: string[]): TelemetryEvent {
  return { step: 'select-goal.select', action: goals.join(',') };
}
