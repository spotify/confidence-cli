import { type ChildProcess, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import type { OnboardingOpts, OnboardingCallbacks } from '../types.js';
import { STATUS_PREFIX } from '../constants.js';
import { spawnErrorMessage } from '../utils.js';

type AgyStreamEvent = {
  type: string;
  step_type?: string;
  text_delta?: string;
};

export function runOnboarding(
  opts: OnboardingOpts,
  callbacks: OnboardingCallbacks,
): ChildProcess | null {
  const env = opts.token
    ? { ...globalThis.process.env, CONFIDENCE_ACCESS_TOKEN: opts.token }
    : undefined;

  let child: ChildProcess;
  try {
    child = spawn('agy', ['-p', opts.prompt, '--output-format', 'stream-json'], {
      cwd: opts.projectDir,
      timeout: 600_000,
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });
  } catch (err) {
    callbacks.onError(spawnErrorMessage('agy', err as NodeJS.ErrnoException));
    return null;
  }

  if (!child.stdout) return null;

  const allLines: string[] = [];
  let stderrBuf = '';
  let buffer = '';

  function emitCompletedLines() {
    const parts = buffer.split('\n');
    buffer = parts.pop()!;
    for (const part of parts) {
      const stripped = part.trim();
      if (!stripped) continue;
      allLines.push(stripped);
      callbacks.onStdout(stripped);
      if (stripped.startsWith(STATUS_PREFIX)) {
        callbacks.onStatus(stripped.slice(STATUS_PREFIX.length));
      }
    }
  }

  const rl = createInterface({ input: child.stdout });
  rl.on('line', function parseStreamEvent(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return;

    let event: AgyStreamEvent;
    try {
      event = JSON.parse(trimmed) as AgyStreamEvent;
    } catch {
      return;
    }

    if (event.type === 'step_update' && event.step_type === 'agent_response' && event.text_delta) {
      buffer += event.text_delta;
      emitCompletedLines();
    }
  });

  child.stderr?.on('data', (chunk: Buffer) => {
    stderrBuf += chunk.toString();
    const trimmed = chunk.toString().trim();
    if (trimmed) callbacks.onStderr(trimmed);
  });

  child.on('close', (code: number | null) => {
    rl.close();

    const remaining = buffer.trim();
    if (remaining) {
      allLines.push(remaining);
      callbacks.onStdout(remaining);
      if (remaining.startsWith(STATUS_PREFIX)) {
        callbacks.onStatus(remaining.slice(STATUS_PREFIX.length));
      }
    }

    if (code !== 0) {
      callbacks.onError(stderrBuf.trim() || `Process exited with code ${code}`);
      return;
    }
    callbacks.onComplete(allLines);
  });

  child.on('error', (err: NodeJS.ErrnoException) => {
    rl.close();
    callbacks.onError(spawnErrorMessage('agy', err));
  });

  return child;
}
