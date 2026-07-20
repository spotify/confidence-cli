import type { TelemetryEvent } from '@lib/telemetry.js';

export function welcomeMenuSelected(value: string): TelemetryEvent {
  return {
    step: 'welcome.menu',
    action: value,
    completion: value === 'quit' ? 'done' : 'in_progress',
  };
}
