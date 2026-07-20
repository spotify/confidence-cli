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

export function mcpVerified(url: string | undefined, reachable: boolean): LogMessage {
  return {
    input: `POST ${url} (verify)`,
    output: reachable ? 'Reachable' : 'Not responding',
  };
}

export function mcpAuthRefreshed(names: string[]): LogMessage {
  return {
    input: `Refresh MCP auth (${names.join(', ')})`,
    output: 'Token updated',
  };
}
