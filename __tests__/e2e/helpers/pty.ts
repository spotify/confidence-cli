import { spawn as ptySpawn, type IPty } from 'node-pty';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stripAnsi } from './strip-ansi.js';
import { renderScreen, normalizeSnapshot } from './screen-buffer.js';
import { E2E_BASE_ENV } from './env.js';

const CLI_PATH = resolve(import.meta.dirname, '../../../dist/bin/cli.js');
const DEFAULT_COLS = 100;
const DEFAULT_ROWS = 40;
const DEFAULT_TIMEOUT = 15_000;

type SessionOptions = {
  args?: string[];
  env?: Record<string, string>;
  cols?: number;
  rows?: number;
  cwd?: string;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  get screen(): string {
    if (this.rawOutput.length !== this.cachedRawLength) {
      this.cachedScreen = stripAnsi(this.rawOutput);
      this.cachedRawLength = this.rawOutput.length;
    }
    return this.cachedScreen;
  }

  get screenSinceCheckpoint(): string {
    return this.screen.slice(this.markPosition);
  }

  addTempDir(dir: string): void {
    this.tempDirs.push(dir);
  }

  checkpoint(): void {
    this.markPosition = this.screen.length;
    this.rawMarkPosition = this.rawOutput.length;
  }

  snapshot(): string {
    const raw = this.rawOutput.slice(this.rawMarkPosition);
    const rendered = renderScreen(raw, this.cols, this.rows);
    return normalizeSnapshot(rendered, this.cwd);
  }

  send(data: string): void {
    this.pty.write(data);
  }

  async sendKey(key: string, settleMs = 100): Promise<void> {
    this.pty.write(key);
    await delay(settleMs);
  }

  async sendKeyRepeat(key: string, count: number, settleMs = 100): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.sendKey(key, settleMs);
    }
  }

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

  async waitForExit(timeout = DEFAULT_TIMEOUT): Promise<number> {
    const timer = setTimeout(() => {
      this.pty.kill();
    }, timeout);

    const code = await this.exitPromise;
    clearTimeout(timer);
    return code;
  }

  kill(): void {
    if (this.exitCode === null) {
      this.pty.kill();
    }
  }

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
