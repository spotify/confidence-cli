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

    const events = [
      { type: 'item.completed', item: { type: 'agent_message', text: 'STATUS: Analyzing project...' } },
      { type: 'item.completed', item: { type: 'agent_message', text: 'STATUS: Installing @spotify-confidence/sdk...' } },
      { type: 'item.completed', item: { type: 'agent_message', text: 'STATUS: Generating Confidence configuration...' } },
      { type: 'item.completed', item: { type: 'agent_message', text: 'STATUS: Creating feature flag example...' } },
      { type: 'item.completed', item: { type: 'agent_message', text: 'Created confidence.config.ts' } },
      { type: 'item.completed', item: { type: 'agent_message', text: 'Added feature flag example' } },
      { type: 'item.completed', item: { type: 'agent_message', text: 'STATUS: Generating CONFIDENCE_QUICKSTART.md report...' } },
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
  });
  return;
}

if (args[0] === '-C') {
  const prompt = args[2] || '';
  fs.writeFileSync(path.join(process.cwd(), '.e2e-chat-prompt'), prompt, 'utf-8');
  process.exit(0);
}
`;
