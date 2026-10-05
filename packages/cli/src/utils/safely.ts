import { fail } from '@output/print.js';

export function safely(
  fn: (argv: Record<string, unknown>) => Promise<void>,
): (argv: Record<string, unknown>) => Promise<void> {
  return async (argv) => {
    try {
      await fn(argv as Record<string, unknown>);
    } catch (err) {
      fail((err as Error).message);
    }
  };
}
