import type { Argv } from 'yargs';
import { QUICKSTART_BUILDER, launchQuickstart } from '@features/quickstart/index.js';

export const flagsCommand = {
  command: 'flags <action>',
  describe: 'Manage feature flags',
  builder(yargs: Argv) {
    return yargs
      .command(
        'setup',
        'Set up feature flags in your project',
        QUICKSTART_BUILDER,
        async (argv) => {
          await launchQuickstart(argv as Record<string, unknown>, { features: ['flags'] });
        },
      )
      .demandCommand(1, 'Run "confidence flags --help" to see available actions.')
      .strict();
  },
  handler() {},
};
