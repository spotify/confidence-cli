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
} else if (args[0] === 'agent') {
  const prompt = args[1] || '';
  fs.writeFileSync(path.join(process.cwd(), '.e2e-chat-prompt'), prompt, 'utf-8');
  process.exit(0);
}
`;
