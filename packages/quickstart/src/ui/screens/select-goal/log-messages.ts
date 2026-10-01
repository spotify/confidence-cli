import type { LogMessage } from '../../lib/log-messages.js';

export function goalsChosen(goals: string): LogMessage {
  return { input: 'Select goals', output: goals };
}

export function recordingsIncompatible(framework: string): LogMessage {
  return {
    input: 'Feature compatibility',
    output: `Session recordings not supported for ${framework} — continuing without recordings`,
  };
}
