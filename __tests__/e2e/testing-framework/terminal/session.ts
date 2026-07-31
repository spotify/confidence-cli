import { spawn as ptySpawn, type IPty } from 'node-pty';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stripAnsi } from './strip-ansi.js';
import { renderScreen, normalizeSnapshot } from './screen-buffer.js';
import { E2E_BASE_ENV } from '../env.js';
import { resolveKey, type Modifiers } from './key-map.js';

const CLI_PATH = resolve(import.meta.dirname, '../../../../dist/bin/cli.js');
const DEFAULT_COLS = 100;
const DEFAULT_ROWS = 40;
const DEFAULT_TIMEOUT = 15_000;

/**
 * Options for constructing a {@link TerminalSession}.
 *
 * @see {@link TerminalSession}
 */
type SessionOptions = {
  /** CLI arguments appended after the binary path. @defaultValue `['--debug']` */
  args?: string[];
  /** Extra environment variables merged on top of the base e2e env. */
  env?: Record<string, string>;
  /** Terminal width in columns. @defaultValue `100` */
  cols?: number;
  /** Terminal height in rows. @defaultValue `40` */
  rows?: number;
  /** Working directory for the spawned process. @defaultValue `process.cwd()` */
  cwd?: string;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Drives a CLI process inside a pseudo-terminal for end-to-end testing.
 *
 * Wraps `node-pty` to spawn the wizard binary in an isolated environment,
 * then exposes high-level methods for sending input, waiting for output,
 * and capturing snapshots. Supports the TC39 Explicit Resource Management
 * protocol (`using`) for automatic cleanup.
 *
 * @example
 * ```ts
 * using session = new TerminalSession({ args: ['--debug'] });
 * await session.waitForText('Welcome');
 * await session.press('Enter');
 * expect(session.snapshot()).toMatchSnapshot('welcome');
 * ```
 */
export class TerminalSession {
  private pty: IPty;
  private rawOutput = '';
  private cachedScreen = '';
  private cachedRawLength = 0;
  private markPosition = 0;
  private rawMarkPosition = 0;
  private exitCode: number | null = null;
  private exitPromise: Promise<number>;
  private tempDirs: string[] = [];

  readonly cwd: string;
  readonly cols: number;
  readonly rows: number;

  constructor(options: SessionOptions = {}) {
    const { args = ['--debug'], env = {}, cols = DEFAULT_COLS, rows = DEFAULT_ROWS, cwd } = options;

    this.cols = cols;
    this.rows = rows;

    const isolatedTmpDir = env.TMPDIR ?? mkdtempSync(join(tmpdir(), 'e2e-'));
    this.cwd = cwd ?? process.cwd();
    this.tempDirs.push(isolatedTmpDir);

    this.pty = ptySpawn(process.execPath, [CLI_PATH, ...args], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: this.cwd,
      env: {
        ...process.env,
        ...E2E_BASE_ENV,
        ...env,
        HOME: isolatedTmpDir,
        TMPDIR: isolatedTmpDir,
      },
    });

    this.pty.onData((data) => {
      this.rawOutput += data;
    });

    this.exitPromise = new Promise<number>((resolve) => {
      this.pty.onExit(({ exitCode }) => {
        this.exitCode = exitCode;
        resolve(exitCode);
      });
    });
  }

  /**
   * The full terminal output with ANSI escape codes stripped.
   *
   * Lazily re-computed only when new data arrives from the PTY.
   * Use {@link screenSinceCheckpoint} for assertions scoped to the current screen.
   */
  get screen(): string {
    if (this.rawOutput.length !== this.cachedRawLength) {
      this.cachedScreen = stripAnsi(this.rawOutput);
      this.cachedRawLength = this.rawOutput.length;
    }
    return this.cachedScreen;
  }

  /**
   * Terminal output accumulated since the last {@link checkpoint} call.
   *
   * This is the default haystack for {@link waitForText} and
   * {@link waitForPattern}, preventing stale text from earlier screens
   * from producing false-positive matches.
   */
  get screenSinceCheckpoint(): string {
    return this.screen.slice(this.markPosition);
  }

  /**
   * Registers a temporary directory for cleanup when the session is disposed.
   *
   * @param dir - Absolute path to remove recursively on disposal.
   */
  addTempDir(dir: string): void {
    this.tempDirs.push(dir);
  }

  /**
   * Marks the current output position so that subsequent calls to
   * {@link waitForText}, {@link waitForPattern}, and {@link snapshot}
   * only consider output produced after this point.
   *
   * Call this between wizard screens to scope assertions to the
   * active screen and avoid matching leftover text from previous ones.
   *
   * @example
   * ```ts
   * await session.waitForText('System Check');
   * session.checkpoint();
   * // From here, waitForText only searches new output
   * await session.waitForText('All checks passed');
   * ```
   */
  checkpoint(): void {
    this.markPosition = this.screen.length;
    this.rawMarkPosition = this.rawOutput.length;
  }

  /**
   * Renders the terminal output since the last {@link checkpoint} into a
   * normalized plain-text grid suitable for Vitest snapshot assertions.
   *
   * The raw ANSI stream is fed through a VT100 screen buffer emulator,
   * then project-specific values (paths, version numbers) are replaced
   * with stable placeholders so snapshots don't break on unrelated changes.
   *
   * @returns A deterministic string ready for `toMatchSnapshot()`.
   *
   * @example
   * ```ts
   * session.checkpoint();
   * await session.press('Enter');
   * await session.waitForText('All checks passed');
   * expect(session.snapshot()).toMatchSnapshot('system-check');
   * ```
   */
  snapshot(): string {
    const raw = this.rawOutput.slice(this.rawMarkPosition);
    const rendered = renderScreen(raw, this.cols, this.rows);
    return normalizeSnapshot(rendered, this.cwd);
  }

  /**
   * Writes raw bytes to the PTY with no delay or key resolution.
   *
   * Prefer {@link press} for keyboard input. Use this only when you
   * need to send an exact byte sequence that `press` cannot produce.
   *
   * @param data - Raw string to write to the PTY.
   */
  write(data: string): void {
    this.pty.write(data);
  }

  /**
   * Sends a single key press to the terminal and waits for it to settle.
   *
   * Accepts named keys (`'Enter'`, `'ArrowDown'`, etc.) following the DOM
   * `KeyboardEvent.key` convention, or single characters (`'a'`, `'1'`).
   * Named keys are resolved to their xterm escape sequences via the
   * internal key map.
   *
   * The second parameter is overloaded: pass a {@link Modifiers} object
   * for modified keys, or a `number` to override the settle delay.
   *
   * @param key - A named key or single character.
   * @param modifiersOrSettleMs - Modifier keys (`{ ctrl: true }`) or settle delay in ms.
   * @param settleMs - Settle delay in ms when the second param is a {@link Modifiers} object.
   *   @defaultValue `100`
   *
   * @example
   * ```ts
   * await session.press('Enter');
   * await session.press('ArrowDown');
   * await session.press('c', { ctrl: true });  // sends Ctrl+C
   * await session.press('Enter', 200);          // 200ms settle
   * ```
   */
  async press(
    key: string,
    modifiersOrSettleMs?: Modifiers | number,
    settleMs = 100,
  ): Promise<void> {
    let modifiers: Modifiers | undefined;
    let settle: number;

    if (typeof modifiersOrSettleMs === 'number') {
      settle = modifiersOrSettleMs;
    } else {
      modifiers = modifiersOrSettleMs;
      settle = settleMs;
    }

    this.pty.write(resolveKey(key, modifiers));
    await delay(settle);
  }

  /**
   * Sends a key press multiple times in sequence, settling between each press.
   *
   * Useful for navigating lists where the target item is N positions away.
   *
   * @param key - A named key or single character (same as {@link press}).
   * @param count - How many times to press the key.
   * @param modifiersOrSettleMs - Modifier keys or settle delay (same as {@link press}).
   * @param settleMs - Settle delay in ms when the third param is a {@link Modifiers} object.
   *   @defaultValue `100`
   *
   * @example
   * ```ts
   * // Select the 4th item in a list (skip 3 down from the first)
   * await session.pressRepeat('ArrowDown', 3);
   * await session.press('Enter');
   * ```
   */
  async pressRepeat(
    key: string,
    count: number,
    modifiersOrSettleMs?: Modifiers | number,
    settleMs = 100,
  ): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.press(key, modifiersOrSettleMs, settleMs);
    }
  }

  /**
   * Polls the terminal output until the given text appears, or throws on timeout.
   *
   * By default searches only output produced since the last {@link checkpoint},
   * which prevents false positives from earlier screens. Pass
   * `{ sinceCheckpoint: false }` to search the entire output history.
   *
   * When an array is passed, resolves as soon as any of the strings is found
   * and returns the matched string — useful when the screen may show one of
   * several possible states.
   *
   * Uses exponential backoff (25 ms to 200 ms) to balance responsiveness
   * with CPU usage.
   *
   * @param text - A string or array of candidate strings to search for.
   * @param options - Optional overrides.
   * @param options.timeout - Maximum time to wait in ms. @defaultValue `15_000`
   * @param options.sinceCheckpoint - Scope the search to post-checkpoint output.
   *   @defaultValue `true`
   * @returns The matched string (useful when `text` is an array).
   * @throws {Error} On timeout, with the last 2 000 characters of output in the message.
   *
   * @example
   * ```ts
   * await session.waitForText('All checks passed');
   *
   * // Branch on which screen appeared
   * const matched = await session.waitForText(['Start onboarding?', 'Connect tools?']);
   * if (matched === 'Connect tools?') { ... }
   * ```
   */
  async waitForText(
    text: string | string[],
    { timeout = DEFAULT_TIMEOUT, sinceCheckpoint = true } = {},
  ): Promise<string> {
    const targets = Array.isArray(text) ? text : [text];
    const deadline = Date.now() + timeout;
    let poll = 25;

    while (Date.now() < deadline) {
      const haystack = sinceCheckpoint ? this.screenSinceCheckpoint : this.screen;
      const match = targets.find((t) => haystack.includes(t));
      if (match) return match;

      await delay(poll);
      poll = Math.min(poll * 2, 200);
    }

    const label =
      targets.length === 1
        ? `"${targets[0]}"`
        : `any of [${targets.map((t) => `"${t}"`).join(', ')}]`;

    throw new Error(
      `Timed out waiting for ${label} after ${timeout}ms.\n\nLast output:\n${this.screen.slice(-2000)}`,
    );
  }

  /**
   * Polls the terminal output until a regex pattern matches, or throws on timeout.
   *
   * Behaves like {@link waitForText} but accepts a `RegExp` and returns the
   * full `RegExpMatchArray`, giving access to capture groups.
   *
   * @param pattern - The regular expression to test against terminal output.
   * @param options - Optional overrides.
   * @param options.timeout - Maximum time to wait in ms. @defaultValue `15_000`
   * @param options.sinceCheckpoint - Scope the search to post-checkpoint output.
   *   @defaultValue `true`
   * @returns The `RegExpMatchArray` from the first successful match.
   * @throws {Error} On timeout, with the last 2 000 characters of output in the message.
   *
   * @example
   * ```ts
   * const match = await session.waitForPattern(/v(\d+\.\d+\.\d+)/);
   * const version = match[1]; // e.g. '1.2.3'
   * ```
   */
  async waitForPattern(
    pattern: RegExp,
    { timeout = DEFAULT_TIMEOUT, sinceCheckpoint = true } = {},
  ): Promise<RegExpMatchArray> {
    const deadline = Date.now() + timeout;
    let poll = 25;

    while (Date.now() < deadline) {
      const haystack = sinceCheckpoint ? this.screenSinceCheckpoint : this.screen;
      const match = haystack.match(pattern);
      if (match) return match;

      await delay(poll);
      poll = Math.min(poll * 2, 200);
    }

    throw new Error(
      `Timed out waiting for pattern ${pattern} after ${timeout}ms.\n\nLast output:\n${this.screen.slice(-2000)}`,
    );
  }

  /**
   * Waits for the CLI process to exit and returns its exit code.
   *
   * If the process hasn't exited within the timeout it is killed with
   * `SIGKILL` and the promise resolves with whatever code the OS assigns.
   *
   * @param timeout - Maximum time to wait in ms. @defaultValue `15_000`
   * @returns The process exit code (0 = success).
   *
   * @example
   * ```ts
   * await session.press('Enter'); // trigger quit
   * const exitCode = await session.waitForExit();
   * expect(exitCode).toBe(0);
   * ```
   */
  async waitForExit(timeout = DEFAULT_TIMEOUT): Promise<number> {
    const timer = setTimeout(() => {
      this.pty.kill();
    }, timeout);

    const code = await this.exitPromise;
    clearTimeout(timer);
    return code;
  }

  /**
   * Immediately kills the PTY process if it is still running.
   *
   * Prefer `using` (which calls this via {@link [Symbol.dispose]}) over
   * manual `kill()` calls so cleanup is guaranteed even on test failure.
   */
  kill(): void {
    if (this.exitCode === null) {
      this.pty.kill();
    }
  }

  /**
   * Disposes the session: kills the PTY and removes all registered temp dirs.
   *
   * Called automatically by the `using` statement (TC39 Explicit Resource
   * Management), ensuring cleanup even when a test throws.
   *
   * @example
   * ```ts
   * using session = createSession();
   * // session is disposed when the block exits
   * ```
   */
  [Symbol.dispose](): void {
    this.kill();
    this.cleanup();
  }

  private cleanup() {
    for (const dir of this.tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}
