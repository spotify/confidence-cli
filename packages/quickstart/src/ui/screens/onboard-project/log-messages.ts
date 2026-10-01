import type { LogMessage } from '../../lib/log-messages.js';

export function onboardingCompleted(
  frameworkName: string | null,
  codeChanges: string[],
): LogMessage {
  return {
    input: frameworkName ?? 'unknown',
    output: codeChanges.length > 0 ? codeChanges.join('; ') : 'Completed',
  };
}

export function onboardingDryRun(framework: string): LogMessage {
  return {
    input: `Agent prompt: "<onboarding prompt for ${framework}>" (dry-run)`,
    output: 'Simulating onboarding steps',
  };
}

export function onboardingStarted(framework: string, prompt: string): LogMessage {
  return { input: `Agent prompt "<onboarding prompt for ${framework}>"`, output: prompt };
}

export function onboardingStdout(line: string): LogMessage {
  return { input: '(stdout)', output: line };
}

export function onboardingStderr(line: string): LogMessage {
  return { input: '(stderr)', output: line };
}

export function onboardingExitError(code: number | null, message: string): LogMessage {
  return { input: '(exit)', output: `Exit code ${code}: ${message}` };
}

export function onboardingExitSuccess(lineCount: number): LogMessage {
  return { input: '(exit)', output: `Exit code 0 (${lineCount} lines)` };
}

export function onboardingSpawnError(message: string): LogMessage {
  return { input: '(error)', output: message };
}

export function onboardingCancelled(): LogMessage {
  return { input: 'Cancel', output: 'Cancelled by user' };
}
