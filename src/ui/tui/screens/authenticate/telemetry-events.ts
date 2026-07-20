import type { TelemetryEvent } from '@lib/telemetry.js';

export function authCompleted(): TelemetryEvent {
  return { step: 'authenticate.result', action: 'completed', sentiment: 'positive' };
}

export function authFailed(): TelemetryEvent {
  return { step: 'authenticate.result', action: 'failed', sentiment: 'frustrated' };
}

export function authExistingConfirmed(): TelemetryEvent {
  return { step: 'authenticate.existing', action: 'confirmed' };
}

export function authBrowserStarted(): TelemetryEvent {
  return { step: 'authenticate.browser', action: 'started' };
}

export function authRetried(): TelemetryEvent {
  return { step: 'authenticate.retry', action: 'retried' };
}

export function authQuit(): TelemetryEvent {
  return {
    step: 'authenticate.quit',
    action: 'quit',
    sentiment: 'frustrated',
    completion: 'done',
  };
}
