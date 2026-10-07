import type { Argv } from 'yargs';
import { noop } from '@spotify-confidence/shared-kernel';
import { runSdkInstall, runSdkSetup } from '@features/sdk/index.js';
import { safely } from '../utils/safely.js';

export const sdkCommand = {
  command: 'sdk <action>',
  describe: 'Manage SDK installation and setup',
  builder(yargs: Argv) {
    return yargs
      .option('dir', {
        type: 'string',
        describe: 'Target project directory',
        normalize: true,
      })
      .command(
        'install',
        'Detect framework and install the Confidence SDK',
        noop,
        safely(runSdkInstall),
      )
      .command(
        'setup',
        'Set up the Confidence SDK in your project',
        (y: Argv) =>
          y
            .option('ide', {
              type: 'string',
              choices: ['claude', 'cursor', 'codex'] as const,
              describe: 'AI coding agent to use',
            })
            .option('profile', {
              type: 'string',
              describe: 'Auth profile to use',
            }),
        safely(runSdkSetup),
      )
      .demandCommand(1, 'Run "confidence sdk --help" to see available actions.')
      .strict();
  },
  handler() {},
};
