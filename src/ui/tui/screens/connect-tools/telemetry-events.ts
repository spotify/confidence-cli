import type { TelemetryEvent } from '@lib/telemetry.js';

export function connectToolsAdvanced(phase: string): TelemetryEvent {
  return {
    step: `connect-tools.${phase}`,
    action: phase === 'skipped' ? 'skipped' : 'connected',
    sentiment: phase === 'skipped' ? 'neutral' : 'positive',
  };
}

export function connectToolsSkipped(): TelemetryEvent {
  return { step: 'connect-tools.skip', action: 'skipped' };
}

export function connectToolsSelected(value: string): TelemetryEvent {
  return { step: 'connect-tools.connect', action: value };
}
