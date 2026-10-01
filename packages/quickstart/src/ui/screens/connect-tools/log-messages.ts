import type { LogMessage } from '../../lib/log-messages.js';

export function toolsConnected(
  phase: 'already-connected' | 'connected' | 'skipped',
  connected: string[],
): LogMessage {
  return {
    input:
      phase === 'skipped'
        ? 'Skip'
        : phase === 'already-connected'
          ? '(auto — already connected)'
          : 'Connect',
    output: connected.length > 0 ? connected.join(', ') : 'Skipped',
  };
}

export function mcpDetected(url: string, status: string): LogMessage {
  return { input: `POST ${url} (verify)`, output: status };
}

export function mcpRegistered(opts: {
  name: string;
  url: string | undefined;
  ide: string;
  dryRun?: boolean;
}): LogMessage {
  const label = `Register ${opts.name} → ${opts.url} [${opts.ide}]`;
  return {
    input: opts.dryRun ? `${label} (dry-run)` : label,
    output: opts.dryRun ? 'Simulated' : 'Registered',
  };
}

export function mcpVerified(url: string | undefined, status: string): LogMessage {
  const labels: Record<string, string> = {
    connected: 'Reachable',
    installed: 'Not responding',
    'auth-expired': 'Auth expired',
  };
  return {
    input: `POST ${url} (verify)`,
    output: labels[status] ?? status,
  };
}
