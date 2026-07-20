import { useEffect, useState } from 'react';
import type { CheckResult } from '@lib/session.js';
import { useSession, store } from '../../store.js';

const DRY_RUN_CHECKS: CheckResult[] = [
  { name: 'Node.js', found: true, version: 'v20.0.0' },
  { name: 'Git', found: true, version: '2.40.0' },
];

function resolveSystemCheck(dryRun: boolean): { checks: CheckResult[]; running: boolean } {
  if (dryRun) return { checks: DRY_RUN_CHECKS, running: false };
  return { checks: [], running: true };
}

export type InitialSystemCheck = {
  checks: CheckResult[];
  running: boolean;
};

export function useInitialSystemCheck(): InitialSystemCheck {
  const session = useSession();
  const [resolved] = useState(() => resolveSystemCheck(session.dryRun));

  useEffect(
    function syncDryRunChecks() {
      if (resolved.checks.length === 0) return;
      for (const c of resolved.checks) store.setSystemCheck(c.name, c);
    },
    [resolved.checks],
  );

  return resolved;
}
