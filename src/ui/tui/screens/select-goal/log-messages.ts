import type { LogMessage } from '../../lib/log-messages.js';

export function goalChosen(goal: string): LogMessage {
  return { input: 'Select goal', output: goal };
}

export function migrationChosen(targets: string[]): LogMessage {
  return { input: 'Migration', output: targets.length > 0 ? targets.join(', ') : 'None' };
}
