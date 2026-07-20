import type { LogMessage } from '../../lib/log-messages.js';

export function systemCheckPassed(checksOutput: string): LogMessage {
  return { input: '(auto)', output: checksOutput };
}

export function systemCheckQuit(checksOutput: string): LogMessage {
  return { input: 'Quit', output: checksOutput };
}
