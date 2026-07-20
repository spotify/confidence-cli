import type { LogMessage } from '../../lib/log-messages.js';

export function authCompleted(
  workspace: string | null | undefined,
  region: string | null | undefined,
): LogMessage {
  return {
    input: workspace ? 'Use existing account' : 'Browser login',
    output: `Authenticated${workspace ? ` as ${workspace}` : ''}${region ? ` (${region})` : ''}`,
  };
}
