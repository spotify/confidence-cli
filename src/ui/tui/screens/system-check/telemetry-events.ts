import type { TelemetryEvent } from '@lib/telemetry.js';

export function systemCheckPassed(): TelemetryEvent {
  return { step: 'system-check.result', action: 'passed', sentiment: 'positive' };
}

export function systemCheckRetried(): TelemetryEvent {
  return { step: 'system-check.retry', action: 'retried' };
}

export function systemCheckQuit(): TelemetryEvent {
  return {
    step: 'system-check.quit',
    action: 'quit',
    sentiment: 'frustrated',
    completion: 'done',
  };
}
