import { useState } from 'react';
import type { IdeId } from '@integrations/index.js';
import { prepareIde, installPlugin } from '@integrations/index.js';
import { $session, store } from '../../store.js';
import { useInitialDetection } from './useInitialDetection.js';
import { track } from '@lib/telemetry.js';
import { pluginInstallFailed } from './telemetry-events.js';

export type PluginPhase =
  'detecting' | 'already-installed' | 'choose-ide' | 'installing' | 'installed' | 'error';

export type PluginInstallState = {
  phase: PluginPhase;
  detected: string[];
  error: string | null;
  selectIde: (ide: IdeId) => void;
};

export function usePluginInstall(): PluginInstallState {
  const initial = useInitialDetection();
  const [phase, setPhase] = useState<PluginPhase>(initial.phase);
  const [error, setError] = useState<string | null>(null);

  function selectIde(ide: IdeId) {
    store.setIde(ide);
    setPhase('installing');

    if ($session.get().dryRun) return installDryRun(ide);
    installReal(ide);
  }

  function installDryRun(ide: IdeId) {
    setTimeout(() => {
      store.setInstalledPlugins([ide]);
      setPhase('installed');
    }, 1000);
  }

  function installReal(ide: IdeId) {
    prepareIde(ide)
      .then(() => installPlugin(ide, $session.get().projectDir))
      .then(() => {
        store.setInstalledPlugins([ide]);
        setPhase('installed');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Installation failed');
        track(pluginInstallFailed());
        setPhase('error');
      });
  }

  return { phase, detected: initial.detected, error, selectIde };
}
