import type { TelemetryEvent } from '@spotify-confidence/core';

export function aboutBack(): TelemetryEvent {
  return { step: 'about.back', action: 'back' };
}
