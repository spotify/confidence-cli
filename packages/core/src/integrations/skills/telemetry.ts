import type { IdeId } from '@spotify-confidence/shared-kernel';
import { track } from '../../telemetry/telemetry.js';

export function cliFailed(step: string, ide: IdeId): void {
  track({
    step: `plugin.${step}`,
    action: `cli-failed:${ide}`,
    sentiment: 'frustrated',
  });
}
