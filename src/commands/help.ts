import type { Command } from './types.js';
import { APP_NAME, APP_VERSION } from '@lib/meta.js';

export const helpCommand: Command = {
  name: 'help',
  description: 'Show help information',
  aliases: ['h'],
  handler: () => {
    const lines = [
      `${APP_NAME} v${APP_VERSION}`,
      '',
      'Usage: confidence-wizard [command] [options]',
      '',
      'Commands:',
      '  (default)    Launch the interactive setup wizard',
      '  start        Alias for the default command',
      '  help         Show the help message',
      '',
      'Options:',
      '  --dir <path>     Project directory to run the wizard in',
      '  --dry-run        Run without making real API calls',
      '  --debug          Enable debug output and preserve terminal history',
      '  --no-telemetry   Disable anonymous usage telemetry',
      '',
      'Telemetry:',
      '  Anonymous usage data is collected to improve the experience.',
      '  To opt out: --no-telemetry or CONFIDENCE_TELEMETRY=false',
      '',
      'Learn more: https://confidence.spotify.com/docs',
    ];

    console.log(lines.join('\n'));
  },
};
