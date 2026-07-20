import type { TelemetryEvent } from '@lib/telemetry.js';

export function onboardingCompleted(): TelemetryEvent {
  return {
    step: 'onboard-project.result',
    action: 'completed',
    sentiment: 'positive',
    completion: 'completing',
  };
}

export function onboardingFailed(): TelemetryEvent {
  return { step: 'onboard-project.result', action: 'failed', sentiment: 'frustrated' };
}

export function onboardingCancelled(): TelemetryEvent {
  return { step: 'onboard-project.cancel', action: 'cancelled', sentiment: 'confused' };
}

export function onboardingSkipped(): TelemetryEvent {
  return { step: 'onboard-project.skip', action: 'skipped', completion: 'completing' };
}

export function onboardingRetried(): TelemetryEvent {
  return { step: 'onboard-project.retry', action: 'retried' };
}

export function onboardingConfirmed(action: string): TelemetryEvent {
  return { step: 'onboard-project.confirm', action };
}

export function onboardingConfirmSkipped(): TelemetryEvent {
  return { step: 'onboard-project.confirm', action: 'skipped', completion: 'completing' };
}
