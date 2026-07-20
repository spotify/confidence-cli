import { useRef, useState } from 'react';
import { authenticate } from '@lib/auth.js';
import { $session, store } from '../../store.js';
import { useInitialAuth } from './useInitialAuth.js';
import { track } from '@lib/telemetry.js';
import { authFailed } from './telemetry-events.js';

export type AuthPhase =
  'checking' | 'has-existing' | 'choose-action' | 'waiting-browser' | 'authenticated' | 'failed';

export type AuthFlowState = {
  phase: AuthPhase;
  error: string | null;
  workspace: string | null;
  startAuth: (mode: 'signup' | 'login') => void;
  cancelAuth: () => void;
  confirmExisting: () => void;
  resetToChoose: () => void;
};

export function useAuthFlow(): AuthFlowState {
  const initial = useInitialAuth();
  const [phase, setPhase] = useState<AuthPhase>(initial.phase);
  const [error, setError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<string | null>(initial.workspace);
  const abortRef = useRef<AbortController | null>(null);

  function startAuth(mode: 'signup' | 'login') {
    setPhase('waiting-browser');
    setError(null);

    if ($session.get().dryRun) return startDryRunAuth();
    startRealAuth(mode);
  }

  function startDryRunAuth() {
    const timer = setTimeout(() => {
      store.setAuthState({
        status: 'authenticated',
        region: 'EU',
        workspace: 'demo@example.com',
      });
      setWorkspace('demo@example.com');
      setPhase('authenticated');
    }, 2000);
    abortRef.current = {
      abort: () => {
        clearTimeout(timer);
        setPhase('choose-action');
      },
    } as unknown as AbortController;
  }

  function startRealAuth(mode: 'signup' | 'login') {
    const controller = new AbortController();
    abortRef.current = controller;

    authenticate(mode, controller.signal)
      .then((result) => {
        store.setAuthState({
          status: 'authenticated',
          token: result.accessToken,
          refreshToken: result.refreshToken,
          region: result.region,
          workspace: result.workspace,
        });
        setWorkspace(result.workspace ?? null);
        setPhase('authenticated');
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Authentication failed';
        if (msg === 'Authentication cancelled') {
          setPhase('choose-action');
          return;
        }
        setError(msg);
        store.setAuthState({ status: 'failed', error: msg });
        track(authFailed());
        setPhase('failed');
      })
      .finally(() => {
        abortRef.current = null;
      });
  }

  function cancelAuth() {
    abortRef.current?.abort();
  }

  function confirmExisting() {
    setPhase('authenticated');
  }

  function resetToChoose() {
    setPhase('choose-action');
  }

  return {
    phase,
    error,
    workspace,
    startAuth,
    cancelAuth,
    confirmExisting,
    resetToChoose,
  };
}
