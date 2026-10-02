import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AUTH_CALLBACK_PORT } from './env.js';
import { ONBOARDING_INVOCATION_FILE } from './mocks/index.js';

const DEFAULT_TIMEOUT = 15_000;

/**
 * Simulates the browser-side OAuth callback that the wizard waits for
 * during authentication.
 *
 * Polls the wizard's local callback server until it accepts a request,
 * using exponential backoff. The wizard must already be displaying
 * "Waiting for browser" before this is called.
 *
 * @throws {Error} If the callback server is not ready within 15 seconds.
 *
 * @example
 * ```ts
 * await session.press('Enter'); // initiate sign-in
 * await session.waitForText('Waiting for browser');
 * await simulateAuthCallback();
 * await session.waitForText('Authenticated');
 * ```
 */
export async function simulateAuthCallback(): Promise<void> {
  const deadline = Date.now() + DEFAULT_TIMEOUT;
  let backoff = 50;

  while (Date.now() < deadline) {
    try {
      await fetch(`http://localhost:${AUTH_CALLBACK_PORT}/callback?code=test-auth-code`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, backoff));
      backoff = Math.min(backoff * 2, 500);
    }
  }
  throw new Error(`Auth callback server not ready after ${DEFAULT_TIMEOUT / 1000}s`);
}

/**
 * The recorded invocation of an IDE CLI during onboarding,
 * written to disk by the mock binary so tests can assert on the
 * exact command, arguments, and prompt that were passed.
 */
export type Invocation = {
  /** The IDE binary name (e.g. `'claude'`, `'cursor'`, `'codex'`). */
  command: string;
  /** The full argument list passed to the binary. */
  args: string[];
  /** The onboarding prompt sent to the IDE. */
  prompt: string;
};

/**
 * Reads the onboarding invocation JSON that the mock IDE binary wrote
 * to the project directory during onboarding.
 *
 * @param cwd - The project directory (typically `session.cwd`).
 * @returns The parsed {@link Invocation} containing the command, args, and prompt.
 *
 * @example
 * ```ts
 * const invocation = readInvocation(session.cwd);
 * expect(invocation.command).toBe('claude');
 * expect(invocation.prompt).toContain('Confidence SDK');
 * ```
 */
export function readInvocation(cwd: string): Invocation {
  return JSON.parse(readFileSync(join(cwd, ONBOARDING_INVOCATION_FILE), 'utf-8')) as Invocation;
}
