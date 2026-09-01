import type { PluginInstallationMethod } from '@integrations/types.js';
import type { TelemetryEvent } from '@lib/telemetry.js';

export function pluginsAlreadyDetected(): TelemetryEvent {
  return { step: 'install-plugins.detect', action: 'already-installed', sentiment: 'positive' };
}

export function pluginInstallCompleted(method?: PluginInstallationMethod | null): TelemetryEvent {
  return {
    step: 'install-plugins.install',
    action: method ? `completed:${method}` : 'completed',
    sentiment: 'positive',
  };
}

export function pluginInstallFailed(): TelemetryEvent {
  return { step: 'install-plugins.install', action: 'failed', sentiment: 'frustrated' };
}

export function pluginIdeSelected(ide: string): TelemetryEvent {
  return { step: 'install-plugins.ide', action: ide };
}

export function pluginExitedAfterError(): TelemetryEvent {
  return { step: 'install-plugins.exit', action: 'exited-after-error', sentiment: 'frustrated' };
}
