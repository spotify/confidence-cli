import { useState } from 'react';
import { useSession } from '../../store.js';
import type { WizardSession } from '@lib/session.js';
import { BROWSER_PLATFORMS } from '@lib/sdk-options.js';

export type Phase = 'select-goal' | 'done';

type InitialGoalSelection = {
  phase: Phase;
  supportsRecordings: boolean;
};

export function useInitialGoalSelection(): InitialGoalSelection {
  const session = useSession();
  const [resolved] = useState(() => resolveInitialGoalSelection(session));
  return resolved;
}

function resolveInitialGoalSelection(session: WizardSession): InitialGoalSelection {
  const supportsRecordings = !!session.framework && BROWSER_PLATFORMS.has(session.framework);
  const phase = supportsRecordings ? 'select-goal' : 'done';
  return { phase, supportsRecordings };
}
