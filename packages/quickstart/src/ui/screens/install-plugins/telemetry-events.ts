import type { TelemetryEvent } from '@spotify-confidence/core';

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

export function pluginIdeRestoredFromConfig(ide: string): TelemetryEvent {
  return { step: 'install-plugins.ide', action: `restored:${ide}`, sentiment: 'positive' };
}

export function pluginExitedAfterError(): TelemetryEvent {
  return { step: 'install-plugins.exit', action: 'exited-after-error', sentiment: 'frustrated' };
}
