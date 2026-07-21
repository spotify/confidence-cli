import { streamEventsSnippet } from './mock-streaming.js';

export const CODEX_SCRIPT = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);

if (args[0] === '--version') {
  process.stdout.write('1.0.0\\n');
  process.exit(0);
}

if (args[0] === 'login') {
  process.exit(0);
}

if (args[0] === 'mcp') {
  process.exit(0);
}

if (args[0] === 'exec') {
  let input = '';
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    fs.writeFileSync(
      path.join(process.cwd(), '.e2e-onboarding-invocation'),
      JSON.stringify({ command: 'codex', args, prompt: input }),
      'utf-8'
    );
${streamEventsSnippet('codex')}
  });
  return;
}

if (args[0] === '-C') {
  const prompt = args[2] || '';
  fs.writeFileSync(path.join(process.cwd(), '.e2e-chat-prompt'), prompt, 'utf-8');
  process.exit(0);
}
`;
