import { useSession } from '@ui/tui/store.js';

export function useSkippedOnboarding() {
  const { codeChanges } = useSession();
  return codeChanges.length === 0;
}
