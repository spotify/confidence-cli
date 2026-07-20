import { useSession } from '../../store.js';
import { useState } from 'react';
import type { McpPhase } from './useMcpConnect.js';

function resolveMcpDetection(dryRun: boolean): { phase: McpPhase } {
  return { phase: dryRun ? 'ask-install' : 'detecting' };
}

export type InitialMcpDetection = {
  phase: McpPhase;
};

export function useInitialMcpDetection(): InitialMcpDetection {
  const session = useSession();
  const [resolved] = useState(() => resolveMcpDetection(session.dryRun));
  return resolved;
}
