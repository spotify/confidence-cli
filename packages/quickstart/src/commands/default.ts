import type { Command } from './types.js';
import { startTui } from '@ui/start-tui.js';
import { resolveGoals } from './resolve-goals.js';

export const defaultCommand: Command = {
  name: '$0',
  description: 'Launch the Confidence setup wizard',
  handler: async (argv) => {
    const args = argv as Record<string, unknown>;
    const dryRun = Boolean(args['dry-run'] ?? args.dryRun);
    const debug = Boolean(args.debug);
    const dir = args.dir as string | undefined;
    const noTelemetry = args.telemetry === false;
    const goals = resolveGoals(args.features as string[] | undefined);

    if (noTelemetry) {
      process.env.CONFIDENCE_TELEMETRY = 'false';
    }

    await startTui({ dryRun, debug, dir, goals });
  },
};
