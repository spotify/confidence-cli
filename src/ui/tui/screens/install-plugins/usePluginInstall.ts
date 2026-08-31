import { useState } from 'react';
import type { IdeId } from '@integrations/index.js';
import { prepareIde, installPlugin } from '@integrations/index.js';
import type { ChosenIde } from '@lib/session.js';
import { $session, store } from '../../store.js';
import { useInitialDetection } from './useInitialDetection.js';
import { track } from '@lib/telemetry.js';
import { pluginInstallFailed } from './telemetry-events.js';

export type PluginPhase =
  'detecting' | 'already-installed' | 'choose-ide' | 'installing' | 'installed' | 'error';

export type PluginInstallState = {
  phase: PluginPhase;
  detected: ChosenIde[];
  error: string | null;
  selectIde: (ide: IdeId) => void;
};

export function usePluginInstall(): PluginInstallState {
  const initial = useInitialDetection();
  const [installPhase, setInstallPhase] = useState<PluginPhase | null>(null);
  const [error, setError] = useState<string | null>(null);

  const phase = installPhase ?? initial.phase;

  function selectIde(ide: IdeId) {
    store.setIde(ide);
    setInstallPhase('installing');

    if ($session.get().dryRun) return installDryRun(ide);
    installReal(ide);
  }

  function installDryRun(ide: IdeId) {
    setTimeout(() => {
      store.setPluginTargets([ide]);
      store.setPluginInstallMethod('download');
      setInstallPhase('installed');
    }, 1000);
  }

  function installReal(ide: IdeId) {
    prepareIde(ide)
      .then(() => installPlugin(ide, $session.get().projectDir))
      .then((method) => {
        store.setPluginTargets([ide]);
        store.setPluginInstallMethod(method);
        setInstallPhase('installed');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Installation failed');
        track(pluginInstallFailed());
        setInstallPhase('error');
      });
  }

  return { phase, detected: initial.detected, error, selectIde };
}
