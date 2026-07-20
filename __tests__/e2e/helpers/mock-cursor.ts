import { streamEventsSnippet } from './mock-streaming.js';

export const CURSOR_SCRIPT = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);

if (args[0] === 'agent' && args[1] === '--version') {
  process.stdout.write('1.0.0\\n');
  process.exit(0);
} else if (args[0] === 'agent' && args[1] === 'status') {
  process.exit(0);
} else if (args[0] === 'agent' && args[1] === 'mcp') {
  process.exit(0);
} else if (args[0] === 'agent' && args.includes('--print')) {
  fs.writeFileSync(
    path.join(process.cwd(), '.e2e-onboarding-invocation'),
    JSON.stringify({ command: 'cursor', args, prompt: args[args.length - 1] }),
    'utf-8'
  );
${streamEventsSnippet('claude')}
} else if (args[0] === 'agent') {
  const prompt = args[1] || '';
  fs.writeFileSync(path.join(process.cwd(), '.e2e-chat-prompt'), prompt, 'utf-8');
  process.exit(0);
}
`;
