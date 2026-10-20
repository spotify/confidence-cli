import { message } from '@output/print.js';

export function isDryRun(argv: Record<string, unknown>): boolean {
  return Boolean(argv['dry-run']);
}

export function dryRunGuard(argv: Record<string, unknown>, payload: unknown): boolean {
  if (!isDryRun(argv)) return false;

  message(JSON.stringify(payload, null, 2));
  return true;
}
