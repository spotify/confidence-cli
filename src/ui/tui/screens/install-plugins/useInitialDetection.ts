import { useCallback, useEffect, useState } from 'react';
import { type InstalledPlugin, detectInstalledPlugins } from '@integrations/index.js';
import type { IdeId } from '@lib/session.js';
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

  const applyResults = useCallback(function applyResults(found: InstalledPlugin[]) {
    const ides = found.map((d) => d.ide);
    setDetected(ides);
    setPhase(found.length > 0 ? 'already-installed' : 'choose-ide');

    if (found.length > 0) {
      store.setPluginTargets(ides);
      store.setPluginInstallMethod(found[0].via);
    }
  }, []);

  useEffect(
    function resolveInitialDetection() {
      if (session.dryRun) return;
      detectInstalledPlugins(session.projectDir).then(applyResults);
    },
    [session.dryRun, session.projectDir, applyResults],
  );

  return { phase, detected };
}
