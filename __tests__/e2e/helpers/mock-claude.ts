import { writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';

export const CHAT_PROMPT_FILE = '.e2e-chat-prompt';

const MOCK_SCRIPT = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);

// Handle 'mcp remove' and 'mcp add' commands used by ConnectTools screen
if (args[0] === 'mcp') {
  process.exit(0);
}

// Handle '--append-system-prompt' for chat launch
if (args.includes('--append-system-prompt')) {
  const idx = args.indexOf('--append-system-prompt');
  const prompt = args[idx + 1] || '';
  fs.writeFileSync(path.join(process.cwd(), '${CHAT_PROMPT_FILE}'), prompt, 'utf-8');
  process.exit(0);
}

// Handle '--print' for onboarding
if (args.includes('--print')) {
  const events = [
    { type: 'assistant', message: { content: [{ type: 'text', text: 'STATUS: Analyzing project...' }] } },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'STATUS: Installing @spotify-confidence/sdk...' }] } },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'STATUS: Generating Confidence configuration...' }] } },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'STATUS: Creating feature flag example...' }] } },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'Created confidence.config.ts' }] } },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'Added feature flag example' }] } },
    { type: 'result', result: 'STATUS: Generating CONFIDENCE_QUICKSTART.md report...' },
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i < events.length) {
      process.stdout.write(JSON.stringify(events[i]) + '\\n');
      i++;
    } else {
      clearInterval(interval);
      process.exit(0);
    }
  }, 200);
}
`;

export function createMockBinDir(dir: string): string {
  const binDir = join(dir, 'bin');
  mkdirSync(binDir, { recursive: true });

  const claudePath = join(binDir, 'claude');
  writeFileSync(claudePath, MOCK_SCRIPT, 'utf-8');
  chmodSync(claudePath, 0o755);

  const openPath = join(binDir, 'open');
  writeFileSync(openPath, '#!/bin/sh\nexit 0\n', 'utf-8');
  chmodSync(openPath, 0o755);

  return binDir;
}
