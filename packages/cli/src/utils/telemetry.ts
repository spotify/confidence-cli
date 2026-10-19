import { initTelemetry, isTelemetryEnabled, getTelemetry, flush } from '@spotify-confidence/core';

export { flush as flushTelemetry };

export function telemetryMiddleware(argv: {
  telemetry: boolean;
  _: (string | number)[];
  'dry-run'?: boolean;
}) {
  const [group, action] = argv._;
  if (
    argv['dry-run'] === true &&
    (group === 'data' || (group === 'warehouse' && (action === 'list' || action === 'get')))
  ) {
    return;
  }
  if (!isTelemetryEnabled() || argv.telemetry === false) return;
  initTelemetry({ source: 'cli' });

  const command = argv._.join('.') || 'unknown';
  getTelemetry().track({ step: command, action: 'invoked' });
}
