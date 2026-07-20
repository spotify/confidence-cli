import { useEffect, useState } from 'react';
import { useSession, store } from '../../store.js';
import type { OnboardingPhase } from './useOnboardingProcess.js';
import type { WizardSession } from '@lib/session.js';
import { detectProviders, type DetectedProvider } from '@providers/index.js';
import { isDirectoryEmpty } from '@lib/fs.js';

export type InitialOnboarding = {
  phase: OnboardingPhase;
  frameworkName: string | null;
  needsSdkSelection: boolean;
};

export function useInitialOnboarding(): InitialOnboarding {
  const session = useSession();
  const [resolved] = useState(() => resolveOnboarding(session.dryRun, session));

  useEffect(
    function syncEmptyProject() {
      if (!resolved.directoryEmpty) return;
      store.setEmptyProject(true);
    },
    [resolved.directoryEmpty],
  );

  useEffect(
    function syncDetectedProviders() {
      if (resolved.detectedProviders.length === 0) return;
      store.setDetectedProviders(resolved.detectedProviders);
    },
    [resolved.detectedProviders],
  );

  return resolved;
}

type ResolvedOnboarding = InitialOnboarding & {
  directoryEmpty: boolean;
  detectedProviders: DetectedProvider[];
};

function resolveOnboarding(dryRun: boolean, session: WizardSession): ResolvedOnboarding {
  const directoryEmpty = !dryRun && isDirectoryEmpty(session.projectDir);
  const needsSdkSelection = directoryEmpty && session.frameworkSource !== 'selected';
  const providers = !dryRun && !directoryEmpty ? detectProviders(session.projectDir) : [];

  return {
    phase: 'confirm',
    frameworkName: dryRun ? (session.framework ?? 'React') : session.framework,
    needsSdkSelection,
    directoryEmpty,
    detectedProviders: providers,
  };
}
