import { useCallback, useEffect, useState } from 'react';
import { runAllChecks } from '@lib/system-check.js';
import type { CheckResult } from '@lib/session.js';
import { useSession, store } from '../../store.js';
import { useInitialSystemCheck } from './useInitialSystemCheck.js';

export type SystemCheckState = {
  checks: CheckResult[];
  running: boolean;
  allPassed: boolean;
  hasFailed: boolean;
  retry: () => void;
};

export function useSystemCheck(): SystemCheckState {
  const session = useSession();
  const initial = useInitialSystemCheck();
  const [checks, setChecks] = useState<CheckResult[]>(initial.checks);
  const [running, setRunning] = useState(initial.running);

  const applyResults = useCallback(function applyResults(results: CheckResult[]) {
    setChecks(results);
    for (const c of results) store.setSystemCheck(c.name, c);
    setRunning(false);
  }, []);

  useEffect(
    function runInitialChecks() {
      if (session.dryRun) return;
      runAllChecks().then(applyResults);
    },
    [session.dryRun, applyResults],
  );

  function retry() {
    setRunning(true);
    setChecks([]);
    runAllChecks().then(applyResults);
  }

  const allPassed = checks.length > 0 && checks.every((c) => c.found);
  const hasFailed = checks.length > 0 && checks.some((c) => !c.found);

  return { checks, running, allPassed, hasFailed, retry };
}
