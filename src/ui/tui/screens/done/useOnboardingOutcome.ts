import type { OnboardingOutcome } from '@lib/session.js';
import { useSession } from '@ui/tui/store.js';

export function useOnboardingOutcome(): OnboardingOutcome {
  const { onboardingOutcome, codeChanges } = useSession();
  return onboardingOutcome ?? (codeChanges.length > 0 ? 'completed' : 'skipped');
}
