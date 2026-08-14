import type { TelemetryEvent } from '@lib/telemetry.js';

export function goalSelected(goal: string): TelemetryEvent {
  return { step: 'select-goal.select', action: goal };
}

export function goalSkipped(): TelemetryEvent {
  return { step: 'select-goal.skip', action: 'skipped', completion: 'completing' };
}

export function migrationSelected(action: string): TelemetryEvent {
  return { step: 'select-goal.migration', action };
}
