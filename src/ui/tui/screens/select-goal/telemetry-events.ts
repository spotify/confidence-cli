import type { TelemetryEvent } from '@lib/telemetry.js';

export function goalsSelected(goals: string[]): TelemetryEvent {
  return { step: 'select-goal.select', action: goals.join(',') };
}

export function agentChangeRequested(): TelemetryEvent {
  return { step: 'select-goal.change-agent', action: 'back' };
}
