export function simulateTTY(isTTY: boolean): Disposable {
  const originalTTY = process.stdin.isTTY;
  const originalCI = process.env.CI;
  process.stdin.isTTY = (isTTY || undefined) as typeof process.stdin.isTTY;

  if (isTTY) delete process.env.CI;

  return {
    [Symbol.dispose]: () => {
      process.stdin.isTTY = originalTTY;
      if (originalCI !== undefined) process.env.CI = originalCI;
      else delete process.env.CI;
    },
  };
}
