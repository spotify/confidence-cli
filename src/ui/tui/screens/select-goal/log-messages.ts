import type { LogMessage } from '../../lib/log-messages.js';

export function goalChosen(goal: string): LogMessage {
  return { input: 'Select goal', output: goal };
}
