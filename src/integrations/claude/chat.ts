import { spawn } from 'node:child_process';
import type { ChatOpts } from '../types.js';

export function launchChat({ prompt, cwd }: ChatOpts): void {
  spawn('claude', ['--append-system-prompt', prompt], {
    cwd,
    stdio: 'inherit',
    detached: false,
  });
}
