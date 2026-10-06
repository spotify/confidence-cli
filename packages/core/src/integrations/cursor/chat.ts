import { spawn } from '../../exec/exec.js';
import type { ChatOpts } from '../types.js';

export function launchChat({ userPrompt, systemPrompt, cwd, token }: ChatOpts): void {
  const env = token ? { ...globalThis.process.env, CONFIDENCE_ACCESS_TOKEN: token } : undefined;
  const prompt = [systemPrompt, userPrompt].filter(Boolean).join('\n\n');

  spawn('cursor', ['agent', prompt, '--approve-mcps'], {
    cwd,
    stdio: 'inherit',
    detached: false,
    env,
  });
}
