import type { TelemetryEvent } from '@lib/telemetry.js';

export function goalsSelected(goals: string[]): TelemetryEvent {
  return { step: 'select-goal.select', action: goals.join(',') };
}

export function goalSkipped(): TelemetryEvent {
  return { step: 'select-goal.skip', action: 'skipped', completion: 'completing' };
}
