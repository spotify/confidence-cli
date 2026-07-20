import { useTerminalSize } from './useTerminalSize.js';

const NARROW_THRESHOLD = 60;

export function useIsNarrow(): boolean {
  const { columns } = useTerminalSize();
  return columns < NARROW_THRESHOLD;
}
