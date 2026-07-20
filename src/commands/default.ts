import type { Command } from './types.js';
import { startTui } from '@ui/tui/start-tui.js';

export const defaultCommand: Command = {
  name: '$0',
  description: 'Launch the Confidence setup wizard',
  handler: async (argv) => {
    const args = argv as Record<string, unknown>;
    const dryRun = Boolean(args['dry-run'] ?? args.dryRun);
    const debug = Boolean(args.debug);
    const dir = args.dir as string | undefined;
    const noTelemetry = Boolean(args['no-telemetry'] ?? args.noTelemetry);

    if (noTelemetry) {
      process.env.CONFIDENCE_TELEMETRY = 'false';
    }

    const { cleanup } = await startTui({ dryRun, debug, dir });

    process.on('SIGINT', () => {
      cleanup();
      process.exit(0);
    });
  },
};
