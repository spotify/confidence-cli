import type { LogMessage } from '../../lib/log-messages.js';

export function goalsChosen(goals: string): LogMessage {
  return { input: 'Select goals', output: goals };
}
