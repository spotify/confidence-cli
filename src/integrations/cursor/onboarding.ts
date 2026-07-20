import { type ChildProcess, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import type { OnboardingOpts, OnboardingCallbacks } from '../types.js';

const STATUS_PREFIX = 'STATUS: ';

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
    opts.prompt,
    '--output-format',
    'text',
    '--approve-mcps',
    '--yolo',
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
  rl.on('line', (line: string) => {
    allLines.push(line);
    const trimmed = line.trim();
    if (!trimmed) return;
    callbacks.onStdout(trimmed);
    if (trimmed.startsWith(STATUS_PREFIX)) {
      callbacks.onStatus(trimmed.slice(STATUS_PREFIX.length));
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
