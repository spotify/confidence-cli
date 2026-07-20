import { spawn } from 'node:child_process';
import type { ChatOpts } from '../types.js';

export function launchChat({ prompt, cwd, token }: ChatOpts): void {
  const env = token ? { ...globalThis.process.env, CONFIDENCE_ACCESS_TOKEN: token } : undefined;

  spawn('cursor', ['agent', prompt, '--approve-mcps'], {
    cwd,
    stdio: 'inherit',
    detached: false,
    env,
  });
}
