import { useEffect } from 'react';
import type { DetectedProvider } from '@providers/types.js';
import { $session, store } from '../../store.js';

export function useSyncProviders(providers: DetectedProvider[]): void {
  useEffect(
    function syncDetectedProviders() {
      if (providers.length === 0) return;

      const current = $session.get().detectedProviders;
      if (
        current.length === providers.length &&
        current.every((p: DetectedProvider, i: number) => p.id === providers[i].id)
      ) {
        return;
      }

      store.setDetectedProviders(providers);
    },
    [providers],
  );
}
