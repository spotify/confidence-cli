import { streamEventsSnippet } from './mock-streaming.js';

export const CLAUDE_SCRIPT = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);

if (args[0] === 'mcp') {
  process.exit(0);
}

if (args.includes('--append-system-prompt')) {
  const idx = args.indexOf('--append-system-prompt');
  const prompt = args[idx + 1] || '';
  fs.writeFileSync(path.join(process.cwd(), '.e2e-chat-prompt'), prompt, 'utf-8');
  process.exit(0);
}

if (args.includes('--print')) {
  fs.writeFileSync(
    path.join(process.cwd(), '.e2e-onboarding-invocation'),
    JSON.stringify({ command: 'claude', args, prompt: args[args.length - 1] }),
    'utf-8'
  );
${streamEventsSnippet('claude')}
}
`;
