import type { TelemetryEvent } from '@lib/telemetry.js';

export function aboutBack(): TelemetryEvent {
  return { step: 'about.back', action: 'back' };
}
