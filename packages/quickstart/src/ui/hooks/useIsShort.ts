import { useTerminalSize } from './useTerminalSize.js';

const SHORT_THRESHOLD = 28;

export function useIsShort(): boolean {
  const { rows } = useTerminalSize();
  return rows < SHORT_THRESHOLD;
}
