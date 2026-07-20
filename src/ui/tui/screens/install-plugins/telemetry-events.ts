import type { TelemetryEvent } from '@lib/telemetry.js';

export function pluginsAlreadyDetected(): TelemetryEvent {
  return { step: 'install-plugins.detect', action: 'already-installed', sentiment: 'positive' };
}

export function pluginInstallCompleted(): TelemetryEvent {
  return { step: 'install-plugins.install', action: 'completed', sentiment: 'positive' };
}

export function pluginInstallFailed(): TelemetryEvent {
  return { step: 'install-plugins.install', action: 'failed', sentiment: 'frustrated' };
}

export function pluginIdeSelected(ide: string): TelemetryEvent {
  return { step: 'install-plugins.ide', action: ide };
}

export function pluginSkipped(): TelemetryEvent {
  return { step: 'install-plugins.skip', action: 'skipped' };
}

export function pluginSkippedAfterError(): TelemetryEvent {
  return { step: 'install-plugins.skip', action: 'skipped-after-error', sentiment: 'confused' };
}
