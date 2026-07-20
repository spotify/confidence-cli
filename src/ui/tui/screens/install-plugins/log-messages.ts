import type { LogMessage } from '../../lib/log-messages.js';

export function pluginsAlreadyInstalled(detected: string[]): LogMessage {
  return { input: '(auto — already installed)', output: detected.join(', ') };
}

export function pluginInstalled(ide: string | null | undefined): LogMessage {
  return { input: ide ?? 'unknown', output: `Installed for ${ide}` };
}

export function pluginSkippedAfterError(error: string | null): LogMessage {
  return { input: 'Skip (after error)', output: error ?? 'Installation failed' };
}
