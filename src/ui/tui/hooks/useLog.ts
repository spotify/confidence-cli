import { useCallback } from 'react';
import type { ScreenId } from '@lib/session.js';
import type { LogMessage } from '../lib/log-messages.js';
import { log } from '../lib/logger.js';

export function useLogger(screen: ScreenId) {
  return useCallback(
    function logMessage(inputOrMessage: string | LogMessage, output?: string) {
      if (typeof inputOrMessage === 'string') {
        log(screen, inputOrMessage, output!);
      } else {
        log(screen, inputOrMessage);
      }
    },
    [screen],
  );
}
