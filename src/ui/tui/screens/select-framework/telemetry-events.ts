import type { TelemetryEvent } from '@lib/telemetry.js';

export function frameworkSelected(value: string): TelemetryEvent {
  return { step: 'select-framework.select', action: value };
}
