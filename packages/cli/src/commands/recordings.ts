import type { Argv } from 'yargs';
import { QUICKSTART_BUILDER, launchQuickstart } from '@features/quickstart/index.js';

export const recordingsCommand = {
  command: 'recordings <action>',
  describe: 'Manage session recordings',
  builder(yargs: Argv) {
    return yargs
      .command(
        'setup',
        'Set up session recordings in your project',
        QUICKSTART_BUILDER,
        async (argv) => {
          await launchQuickstart(argv as Record<string, unknown>, { features: ['recordings'] });
        },
      )
      .demandCommand(1, 'Run "confidence recordings --help" to see available actions.')
      .strict();
  },
  handler() {},
};
