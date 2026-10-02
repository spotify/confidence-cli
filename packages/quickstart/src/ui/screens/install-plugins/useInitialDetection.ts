import { useCallback, useEffect, useState } from 'react';
import { type InstalledPlugin, detectInstalledPlugins } from '@spotify-confidence/core';
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
    function applyResults(found: InstalledPlugin[]) {
      const ides = found.map((d) => d.ide);
      setDetected(ides);
      setPhase(savedIde ? 'restoring' : found.length > 0 ? 'already-installed' : 'choose-ide');

      if (found.length > 0) {
        store.setPluginTargets(ides);
        store.setPluginInstallMethod(found[0].via);
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
