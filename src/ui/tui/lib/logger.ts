import type { ScreenId } from '@lib/session.js';
import type { LogMessage } from './log-messages.js';
import { $session, store } from '../store.js';

export function log(screen: ScreenId, message: LogMessage): void;
export function log(screen: ScreenId, input: string, output: string): void;
export function log(screen: ScreenId, inputOrMessage: string | LogMessage, output?: string): void {
  if (!$session.get().debug) return;
  if (typeof inputOrMessage === 'string') {
    store.addDebugEntry({ screen, input: inputOrMessage, output: output! });
  } else {
    store.addDebugEntry({ screen, ...inputOrMessage });
  }
}
