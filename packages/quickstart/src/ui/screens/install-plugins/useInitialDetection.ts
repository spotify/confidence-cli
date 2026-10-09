import { useCallback, useEffect, useState } from 'react';
import { detectInstalledPlugins } from '@spotify-confidence/core';
import type { IdeId } from '@spotify-confidence/shared-kernel';
import { useSession, store } from '../../store.js';
import type { PluginPhase } from './usePluginInstall.js';

export type InitialDetection = {
  phase: PluginPhase;
  detected: IdeId[];
};

export function useInitialDetection(): InitialDetection {
  const session = useSession();
  const [phase, setPhase] = useState<PluginPhase>(session.dryRun ? 'choose-ide' : 'detecting');
  const [detected, setDetected] = useState<IdeId[]>([]);
  const [savedIde] = useState<IdeId | null>(() => session.ide);

  const applyResults = useCallback(
    function applyResults(ides: IdeId[]) {
      setDetected(ides);
      setPhase(savedIde ? 'restoring' : ides.length > 0 ? 'already-installed' : 'choose-ide');

      if (ides.length > 0) {
        store.setPluginTargets(ides);
      }
    },
    [savedIde],
  );

  useEffect(
    function resolveInitialDetection() {
      if (session.dryRun) return;
      detectInstalledPlugins(session.projectDir).then(applyResults);
    },
    [session.dryRun, session.projectDir, applyResults],
  );

  return { phase, detected };
}
