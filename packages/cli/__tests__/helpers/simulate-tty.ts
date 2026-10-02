export function simulateTTY(isTTY: boolean): Disposable {
  const original = process.stdin.isTTY;
  process.stdin.isTTY = (isTTY || undefined) as typeof process.stdin.isTTY;
  return { [Symbol.dispose]: () => void (process.stdin.isTTY = original) };
}
