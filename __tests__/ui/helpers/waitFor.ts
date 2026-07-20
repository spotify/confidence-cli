import { delay } from './delay.js';

export async function waitFor(
  fn: () => void,
  { timeout = 5000, interval = 10 } = {},
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      fn();
      return;
    } catch (error) {
      if (!isAssertionError(error)) throw error;
      await delay(interval);
    }
  }
  fn();
}

function isAssertionError(e: unknown) {
  return e instanceof Error && e.name === 'AssertionError';
}
