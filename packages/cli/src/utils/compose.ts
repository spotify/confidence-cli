// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

export function compose<A extends AnyFn, B extends AnyFn, C extends AnyFn>(
  outer: (fn: B) => C,
  inner: (fn: A) => B,
): (fn: A) => C {
  return (fn) => outer(inner(fn));
}
