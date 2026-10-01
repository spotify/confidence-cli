/**
 * Flush React's pending passive effects, then run the callback.
 *
 * When a component mounts after an async state change (e.g. a Select
 * appearing after detection), React commits the render output — making
 * lastFrame() show the new text — but schedules useEffect callbacks
 * via the React scheduler, which uses setImmediate in Node.js.
 *
 * In the event loop, the timers phase (where waitFor's delay fires)
 * runs BEFORE the check phase (where setImmediate runs). So waitFor
 * can see the rendered text and return before the useInput effect
 * that subscribes to stdin has fired — and any keypress written
 * between those two phases is silently lost.
 *
 * We yield twice because effects can chain: a first-round effect
 * (e.g. syncDetectedProviders) triggers a re-render whose own effects
 * (e.g. useInput re-subscription) are scheduled in the next
 * setImmediate batch.
 *
 * @see https://nodejs.org/api/timers.html#setimmediatecallback-args — setImmediate fires in the check phase, after timers
 * @see https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#setimmediate-vs-settimeout — event loop phase ordering
 * @see https://github.com/facebook/react/blob/main/packages/scheduler/src/forks/Scheduler.js — React scheduler prefers setImmediate in Node.js
 */
export async function act(fn?: () => void | Promise<void>): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
  await new Promise<void>((resolve) => setImmediate(resolve));
  if (fn) await fn();
}
