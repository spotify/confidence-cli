import type { TelemetryEvent } from '@lib/telemetry.js';

export function doneActionSelected(value: string): TelemetryEvent {
  return { step: 'done.action', action: value, completion: 'done' };
}
