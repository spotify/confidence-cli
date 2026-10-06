import { initTelemetry, isTelemetryEnabled, getTelemetry, flush } from '@spotify-confidence/core';

export { flush as flushTelemetry };

export function telemetryMiddleware(argv: { telemetry: boolean; _: (string | number)[] }) {
  if (!isTelemetryEnabled() || argv.telemetry === false) return;
  initTelemetry({ source: 'cli' });

  const command = argv._.join('.') || 'unknown';
  getTelemetry().track({ step: command, action: 'invoked' });
}
