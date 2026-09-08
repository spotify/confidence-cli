import { useState } from 'react';
import type { IdeId } from '@shared-kernel/types.js';
import { prepareIde, installPlugin, updatePlugin } from '@integrations/index.js';
import { track } from '@lib/telemetry.js';
import { $session, store } from '../../store.js';
import { useInitialDetection } from './useInitialDetection.js';
import { pluginInstallFailed } from './telemetry-events.js';

export type PluginPhase =
  'detecting' | 'already-installed' | 'choose-ide' | 'installing' | 'updating' | 'done' | 'error';

export type PluginInstallState = {
  phase: PluginPhase;
  detected: IdeId[];
  error: string | null;
  selectIde: (ide: IdeId) => void;
};

export function usePluginInstall(): PluginInstallState {
  const initial = useInitialDetection();
  const [installPhase, setInstallPhase] = useState<PluginPhase | null>(null);
  const [error, setError] = useState<string | null>(null);

  const phase = installPhase ?? initial.phase;

  function selectIde(ide: IdeId) {
    const isDetected = initial.detected.includes(ide);

    store.setIde(ide);
    setInstallPhase(isDetected ? 'updating' : 'installing');

    if ($session.get().dryRun) return setupDryRun(ide);
    setupRealPlugin(ide, isDetected);
  }

  function setupDryRun(ide: IdeId) {
    setTimeout(() => {
      store.setPluginTargets([ide]);
      store.setPluginInstallMethod('download');
      setInstallPhase('done');
    }, 1000);
  }

  function setupRealPlugin(ide: IdeId, shouldUpdate: boolean) {
    const action = shouldUpdate ? updatePlugin : installPlugin;

    prepareIde(ide)
      .then(() => action(ide, $session.get().projectDir))
      .then((method) => {
        store.setPluginTargets([ide]);
        store.setPluginInstallMethod(method);
        setInstallPhase('done');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Plugin setup failed');
        track(pluginInstallFailed());
        setInstallPhase('error');
      });
  }

  return { phase, detected: initial.detected, error, selectIde };
}
