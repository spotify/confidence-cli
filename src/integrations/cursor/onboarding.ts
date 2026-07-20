import { type ChildProcess, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import type { OnboardingOpts, OnboardingCallbacks } from '../types.js';
import { STATUS_PREFIX } from '../constants.js';
import { type StreamEvent, extractTextLines } from '../stream-json.js';

export function runOnboarding(
  opts: OnboardingOpts,
  callbacks: OnboardingCallbacks,
): ChildProcess | null {
  const env = opts.token
    ? { ...globalThis.process.env, CONFIDENCE_ACCESS_TOKEN: opts.token }
    : undefined;

  const args = [
    'agent',
    '--print',
    '--output-format',
    'stream-json',
    '--approve-mcps',
    '--yolo',
    opts.prompt,
  ];
  const child = spawn('cursor', args, {
    cwd: opts.projectDir,
    timeout: 300000,
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
  });

  if (!child?.stdout) return null;

  const allLines: string[] = [];
  let stderrBuf = '';

  const rl = createInterface({ input: child.stdout });
  rl.on('line', function parseStreamEvent(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return;

    let event: StreamEvent;
    try {
      event = JSON.parse(trimmed) as StreamEvent;
    } catch {
      return;
    }

    for (const textLine of extractTextLines(event)) {
      const stripped = textLine.trim();
      if (!stripped) continue;
      allLines.push(stripped);
      callbacks.onStdout(stripped);

      const status = stripped.startsWith(STATUS_PREFIX)
        ? stripped.slice(STATUS_PREFIX.length)
        : stripped;
      callbacks.onStatus(status);
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
