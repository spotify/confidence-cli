import type { Argv } from 'yargs';
import { QUICKSTART_BUILDER, launchQuickstart } from '@features/quickstart/index.js';

export const eventsCommand = {
  command: 'events <action>',
  describe: 'Manage event tracking',
  builder(yargs: Argv) {
    return yargs
      .command(
        'setup',
        'Set up event tracking in your project',
        QUICKSTART_BUILDER,
        async (argv) => {
          await launchQuickstart(argv as Record<string, unknown>, { features: ['events'] });
        },
      )
      .demandCommand(1, 'Run "confidence events --help" to see available actions.')
      .strict();
  },
  handler() {},
};
