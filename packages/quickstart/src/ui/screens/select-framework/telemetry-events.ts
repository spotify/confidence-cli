import type { TelemetryEvent } from '@spotify-confidence/core';

export function frameworkSelected(value: string): TelemetryEvent {
  return { step: 'select-framework.select', action: value };
}
