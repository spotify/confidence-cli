import { QUICKSTART_BUILDER, launchQuickstart } from '@features/quickstart/index.js';

export const quickstartCommand = {
  command: 'quickstart',
  describe: 'Launch the interactive Confidence setup wizard',
  builder: QUICKSTART_BUILDER,
  async handler(argv: Record<string, unknown>) {
    await launchQuickstart(argv);
  },
};
