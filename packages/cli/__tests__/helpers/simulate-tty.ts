export function simulateTTY(isTTY: boolean): Disposable {
  const originalStdinTTY = process.stdin.isTTY;
  const originalStdoutTTY = process.stdout.isTTY;
  const originalCI = process.env.CI;
  process.stdin.isTTY = (isTTY || undefined) as typeof process.stdin.isTTY;
  process.stdout.isTTY = (isTTY || undefined) as typeof process.stdout.isTTY;

  if (isTTY) delete process.env.CI;

  return {
    [Symbol.dispose]: () => {
      process.stdin.isTTY = originalStdinTTY;
      process.stdout.isTTY = originalStdoutTTY;
      if (originalCI !== undefined) process.env.CI = originalCI;
      else delete process.env.CI;
    },
  };
}
