import { type ChildProcess, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import type { OnboardingOpts, OnboardingCallbacks } from '../types.js';
import { STATUS_PREFIX } from '../constants.js';

type CodexEvent = {
  type: string;
  item?: {
    type: string;
    text?: string;
  };
};

export function runOnboarding(
  opts: OnboardingOpts,
  callbacks: OnboardingCallbacks,
): ChildProcess | null {
  const env = opts.token
    ? { ...globalThis.process.env, CONFIDENCE_ACCESS_TOKEN: opts.token }
    : undefined;

  const child = spawn('codex', ['exec', '--json', '--sandbox', 'danger-full-access', '-'], {
    cwd: opts.projectDir,
    timeout: 300000,
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });

  child.stdin?.end(opts.prompt);

  if (!child?.stdout) return null;

  const allLines: string[] = [];
  let stderrBuf = '';

  const rl = createInterface({ input: child.stdout });
  rl.on('line', function parseJsonlEvent(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return;

    let event: CodexEvent;
    try {
      event = JSON.parse(trimmed) as CodexEvent;
    } catch {
      return;
    }

    if (event.type !== 'item.completed' || event.item?.type !== 'agent_message') return;
    const text = event.item.text ?? '';

    for (const msgLine of text.split('\n')) {
      const stripped = msgLine.trim();
      if (!stripped) continue;
      allLines.push(stripped);
      callbacks.onStdout(stripped);
      if (stripped.startsWith(STATUS_PREFIX)) {
        callbacks.onStatus(stripped.slice(STATUS_PREFIX.length));
      }
    }
  });

  child.stderr?.on('data', (chunk: Buffer) => {
    stderrBuf += chunk.toString();
    const trimmed = chunk.toString().trim();
    if (trimmed) callbacks.onStderr(trimmed);
  });

  child.on('close', (code: number | null) => {
    rl.close();
    if (code !== 0) {
      callbacks.onError(stderrBuf.trim() || `Process exited with code ${code}`);
      return;
    }
    callbacks.onComplete(allLines);
  });

  child.on('error', (err: Error) => {
    rl.close();
    callbacks.onError(err.message);
  });

  return child;
}
