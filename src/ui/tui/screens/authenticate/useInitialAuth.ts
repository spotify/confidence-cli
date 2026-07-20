import { useEffect, useState } from 'react';
import { loadPersistedToken, validateToken } from '@lib/auth.js';
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
    const result = validateToken(existing);
    if (result.valid) {
      return {
        phase: 'has-existing',
        workspace: result.workspace ?? null,
        authState: {
          status: 'authenticated',
          token: existing,
          region: result.region,
          workspace: result.workspace,
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
