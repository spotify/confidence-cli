export type LogMessage = { input: string; output: string };

export function skipped(): LogMessage {
  return { input: 'Skip', output: 'Skipped' };
}
