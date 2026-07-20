import { useEffect, useState } from 'react';
import { detectInstalledPlugins } from '@integrations/index.js';
import { useSession, store } from '../../store.js';
import type { PluginPhase } from './usePluginInstall.js';

function resolveDetection(
  dryRun: boolean,
  projectDir: string,
): { phase: PluginPhase; detected: string[] } {
  if (dryRun) return { phase: 'choose-ide', detected: [] };
  const found = detectInstalledPlugins(projectDir);
  return {
    phase: found.length > 0 ? 'already-installed' : 'choose-ide',
    detected: found,
  };
}

export type InitialDetection = {
  phase: PluginPhase;
  detected: string[];
};

export function useInitialDetection(): InitialDetection {
  const session = useSession();
  const [resolved] = useState(() => resolveDetection(session.dryRun, session.projectDir));

  useEffect(
    function syncDetectedPlugins() {
      if (resolved.detected.length === 0) return;
      store.setInstalledPlugins(resolved.detected);
    },
    [resolved.detected],
  );

  return resolved;
}
