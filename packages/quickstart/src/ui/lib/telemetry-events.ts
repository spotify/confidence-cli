import { type TelemetryEvent, type ScreenId } from '@spotify-confidence/core';

export function screenEntered(
  screen: ScreenId,
  completion: TelemetryEvent['completion'],
): TelemetryEvent {
  return { step: `${screen}.enter`, action: 'viewed', completion };
}
