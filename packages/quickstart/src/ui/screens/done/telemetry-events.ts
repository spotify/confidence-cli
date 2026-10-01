import type { TelemetryEvent } from '@spotify-confidence/core';

export function doneActionSelected(value: string): TelemetryEvent {
  return { step: 'done.action', action: value, completion: 'done' };
}
