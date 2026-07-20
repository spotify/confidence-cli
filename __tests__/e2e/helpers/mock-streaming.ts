const STATUS_MESSAGES = [
  'STATUS: Analyzing project...',
  'STATUS: Installing @spotify-confidence/sdk...',
  'STATUS: Generating Confidence configuration...',
  'STATUS: Creating feature flag example...',
  'Created confidence.config.ts',
  'Added feature flag example',
  'STATUS: Generating CONFIDENCE_QUICKSTART.md report...',
];

type EventFormat = 'claude' | 'codex';

function buildEvent(format: EventFormat, message: string, isLast: boolean): string {
  if (format === 'codex') {
    return JSON.stringify({
      type: 'item.completed',
      item: { type: 'agent_message', text: message },
    });
  }
  if (isLast) {
    return JSON.stringify({ type: 'result', result: message });
  }
  return JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'text', text: message }] },
  });
}

export function streamEventsSnippet(format: EventFormat): string {
  const events = STATUS_MESSAGES.map((msg, i) =>
    buildEvent(format, msg, i === STATUS_MESSAGES.length - 1),
  );

  return `
  const events = [${events.map((e) => `'${e}'`).join(', ')}];
  let i = 0;
  const interval = setInterval(() => {
    if (i < events.length) {
      process.stdout.write(events[i] + '\\n');
      i++;
    } else {
      clearInterval(interval);
      process.exit(0);
    }
  }, 200);`;
}
