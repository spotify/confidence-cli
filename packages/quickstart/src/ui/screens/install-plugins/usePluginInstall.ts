import { useCallback, useEffect, useState } from 'react';
import type { IdeId } from '@spotify-confidence/shared-kernel';
import { prepareIde, installPlugin, updatePlugin, track } from '@spotify-confidence/core';
import { $session, store } from '../../store.js';
import { useInitialDetection } from './useInitialDetection.js';
import { pluginInstallFailed, pluginIdeRestoredFromConfig } from './telemetry-events.js';
import { saveIdeToConfig } from '../../lib/ide-config.js';

export type PluginPhase =
  | 'detecting'
  | 'restoring'
  | 'already-installed'
  | 'choose-ide'
  | 'installing'
  | 'updating'
  | 'done'
  | 'error';

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

  const selectIde = useCallback(
    function selectIde(ide: IdeId) {
      const isDetected = initial.detected.includes(ide);

      store.setIde(ide);
      saveIdeToConfig(ide);
      setInstallPhase(isDetected ? 'updating' : 'installing');

      if ($session.get().dryRun) {
        setTimeout(() => {
          store.setPluginTargets([ide]);
          store.setPluginInstallMethod('download');
          setInstallPhase('done');
        }, 1000);
        return;
      }

      const action = isDetected ? updatePlugin : installPlugin;

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
    },
    [initial.detected],
  );

  useEffect(
    function autoSelectSavedIde() {
      if (initial.phase !== 'restoring') return;
      if (installPhase !== null) return;

      const ide = $session.get().ide;
      if (!ide) return;

      track(pluginIdeRestoredFromConfig(ide));
      queueMicrotask(() => selectIde(ide));
    },
    [initial.phase, installPhase, selectIde],
  );

  return {
    phase,
    error,
    detected: initial.detected,
    selectIde,
  };
}
