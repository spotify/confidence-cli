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

export function authRefreshFailed(): LogMessage {
  return {
    input: 'Use existing account',
    output: 'Session could not be verified — prompting re-authentication',
  };
}
