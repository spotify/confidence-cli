import type { Argv } from 'yargs';
import { print, extractFlags, fail } from '@output/print.js';
import { listSdks, installSdk } from '@features/sdk/index.js';
import { QUICKSTART_BUILDER, launchQuickstart } from '@features/quickstart/index.js';
import { loadPersistedToken, type FrameworkId } from '@spotify-confidence/core';
import { resolveProjectDir } from '../utils/resolve-project-dir.js';

export const sdkCommand = {
  command: 'sdk <action>',
  describe: 'Manage Confidence SDKs',
  builder(yargs: Argv) {
    return yargs
      .command(
        'list',
        'List available Confidence SDKs',
        () => {},
        (argv) => {
          const sdks = listSdks();
          print({
            data: sdks,
            columns: [
              { key: 'name', header: 'SDK', width: 20 },
              { key: 'package', header: 'Package', width: 45 },
              { key: 'docs', header: 'Docs' },
            ],
            flags: extractFlags(argv as Record<string, unknown>),
          });
        },
      )
      .command(
        'install',
        'Install the Confidence SDK for your project',
        {
          dir: {
            type: 'string' as const,
            describe: 'Project directory',
            normalize: true,
          },
          sdk: {
            type: 'string' as const,
            describe: 'SDK to install (auto-detected if omitted)',
          },
        },
        async (argv) => {
          const args = argv as Record<string, unknown>;
          try {
            await installSdk({
              projectDir: resolveProjectDir(args),
              accessToken: loadPersistedToken() ?? undefined,
              sdkId: args.sdk as FrameworkId | undefined,
            });
          } catch (err) {
            fail((err as Error).message);
          }
        },
      )
      .command('setup', 'Run interactive SDK setup wizard', QUICKSTART_BUILDER, async (argv) => {
        await launchQuickstart(argv as Record<string, unknown>, { features: ['none'] });
      })
      .demandCommand(1, 'Available actions: list, install, setup')
      .strict();
  },
  handler() {},
};
