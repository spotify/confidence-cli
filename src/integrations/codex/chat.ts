import { spawn } from '@lib/exec.js';
import type { ChatOpts } from '../types.js';

export function launchChat({ prompt, cwd, token }: ChatOpts): void {
  const env = token ? { ...globalThis.process.env, CONFIDENCE_ACCESS_TOKEN: token } : undefined;

  spawn('codex', ['-C', cwd, prompt], {
    cwd,
    stdio: 'inherit',
    detached: false,
    env,
  });
}
