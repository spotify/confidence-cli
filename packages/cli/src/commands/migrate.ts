import type { Argv } from 'yargs';
import { noop } from '@spotify-confidence/shared-kernel';
import { getProviders } from '@spotify-confidence/core';
import { detectAndPrint, launchMigration } from '@features/migrate/index.js';
import { safely } from '@utils/index.js';

export const migrateCommand = {
  command: 'migrate <action>',
  describe: 'Detect and migrate from third-party feature flag providers',
  builder(yargs: Argv) {
    let y = yargs
      .option('dir', {
        type: 'string' as const,
        describe: 'Target project directory',
      })
      .option('ide', {
        type: 'string' as const,
        choices: ['claude', 'cursor', 'codex'] as const,
        describe: 'AI coding agent to use',
      })
      .command(
        'detect',
        'Scan project for third-party feature flag providers',
        noop,
        safely(detectAndPrint),
      );

    for (const provider of getProviders()) {
      y = y.command(
        provider.id,
        `Migrate from ${provider.name} to Confidence`,
        noop,
        safely((argv) => launchMigration(argv, provider)),
      );
    }

    return y.demandCommand(1).strict();
  },
  handler() {},
};
