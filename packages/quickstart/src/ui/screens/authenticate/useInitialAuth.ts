import { useEffect, useState } from 'react';
import {
  loadPersistedToken,
  isValidToken,
  extractRegion,
  extractWorkspace,
} from '@spotify-confidence/core';
import { useSession, store } from '../../store.js';
import type { AuthPhase } from './useAuthFlow.js';

type ResolvedAuth = {
  phase: AuthPhase;
  workspace: string | null;
  authState?: {
    status: 'authenticated';
    token: string;
    region?: 'EU' | 'US';
    workspace?: string;
  };
};

function resolveAuth(dryRun: boolean): ResolvedAuth {
  if (dryRun) {
    return {
      phase: 'choose-action',
      workspace: null,
    };
  }

  const existing = loadPersistedToken();
  if (existing) {
    if (isValidToken(existing)) {
      const region = extractRegion(existing);
      const workspace = extractWorkspace(existing);
      return {
        phase: 'has-existing',
        workspace: workspace ?? null,
        authState: {
          status: 'authenticated',
          token: existing,
          region,
          workspace,
        },
      };
    }
  }

  return {
    phase: 'choose-action',
    workspace: null,
  };
}

export type InitialAuth = {
  phase: AuthPhase;
  workspace: string | null;
};

export function useInitialAuth(): InitialAuth {
  const session = useSession();
  const [resolved] = useState(() => resolveAuth(session.dryRun));

  useEffect(
    function syncInitialAuthState() {
      if (!resolved.authState) return;
      store.setAuthState(resolved.authState);
    },
    [resolved.authState],
  );

  return { phase: resolved.phase, workspace: resolved.workspace };
}
