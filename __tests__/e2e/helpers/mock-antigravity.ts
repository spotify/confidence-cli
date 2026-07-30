import { streamEventsSnippet } from './mock-streaming.js';

export const ANTIGRAVITY_SCRIPT = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);

if (args[0] === '--version') {
  process.stdout.write('1.0.0\\n');
  process.exit(0);
}

if (args[0] === '-p') {
  const prompt = args[1] || '';
  fs.writeFileSync(
    path.join(process.cwd(), '.e2e-onboarding-invocation'),
    JSON.stringify({ command: 'agy', args, prompt }),
    'utf-8'
  );
${streamEventsSnippet('antigravity')}
} else if (args[0] === '--prompt-interactive') {
  const prompt = args[1] || '';
  fs.writeFileSync(path.join(process.cwd(), '.e2e-chat-prompt'), prompt, 'utf-8');
  process.exit(0);
} else {
  process.exit(0);
}
`;
