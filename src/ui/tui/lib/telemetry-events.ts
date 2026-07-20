import type { TelemetryEvent } from '@lib/telemetry.js';
import type { ScreenId } from '@lib/session.js';

export function screenEntered(
  screen: ScreenId,
  completion: TelemetryEvent['completion'],
): TelemetryEvent {
  return { step: `${screen}.enter`, action: 'viewed', completion };
}
