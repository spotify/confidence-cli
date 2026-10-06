import { spawn } from '../../exec/exec.js';
import type { ChatOpts } from '../types.js';

export function launchChat({ userPrompt, systemPrompt, cwd }: ChatOpts): void {
  const args: string[] = [];

  if (systemPrompt) args.push('--append-system-prompt', systemPrompt);
  if (userPrompt) args.push('--prompt', userPrompt);

  spawn('claude', args, {
    cwd,
    stdio: 'inherit',
    detached: false,
  });
}
