import type { Argv } from 'yargs';
import { QUICKSTART_BUILDER, launchQuickstart } from '@features/quickstart/index.js';
import {
  listFlagsCmd,
  getFlagCmd,
  createFlagCmd,
  updateFlagCmd,
  toggleFlagCmd,
  resolveFlagCmd,
  targetFlagCmd,
  archiveFlagCmd,
} from '@features/flags/index.js';
import { safely } from '@utils/index.js';

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
      .command(
        'list',
        'List all flags in project',
        (y: Argv) => y.option('page-token', { type: 'string', describe: 'Pagination token' }),
        safely(listFlagsCmd),
      )
      .command(
        'get <flag-key>',
        'Get flag details (variants, targeting, status)',
        (y: Argv) => y.positional('flag-key', { type: 'string', demandOption: true }),
        safely(getFlagCmd),
      )
      .command(
        'create <flag-key>',
        'Create a new flag',
        (y: Argv) =>
          y
            .positional('flag-key', { type: 'string', demandOption: true })
            .option('description', {
              alias: 'd',
              type: 'string',
              describe: 'Flag description',
            })
            .option('variant', {
              type: 'string',
              array: true,
              describe: 'Variant name (e.g. --variant on --variant off)',
            })
            .option('client', { type: 'string', describe: 'Client name for the flag' })
            .option('from-file', { type: 'string', describe: 'Read options from JSON file' }),
        safely(createFlagCmd),
      )
      .command(
        'update <flag-key>',
        'Update flag description or variants',
        (y: Argv) =>
          y
            .positional('flag-key', { type: 'string', demandOption: true })
            .option('description', {
              alias: 'd',
              type: 'string',
              describe: 'New description',
            })
            .option('add-variant', {
              type: 'string',
              array: true,
              describe: 'Variant name to add',
            })
            .option('from-file', { type: 'string', describe: 'Read options from JSON file' }),
        safely(updateFlagCmd),
      )
      .command(
        'toggle <flag-key>',
        'Enable or disable a flag',
        (y: Argv) =>
          y
            .positional('flag-key', { type: 'string', demandOption: true })
            .option('on', { type: 'boolean', describe: 'Enable the flag' })
            .option('off', { type: 'boolean', describe: 'Disable the flag' })
            .conflicts('on', 'off')
            .check((args) => {
              if (!args.on && !args.off) {
                throw new Error('Provide either --on or --off.');
              }
              return true;
            }),
        safely(toggleFlagCmd),
      )
      .command(
        'resolve <flag-key>',
        'Resolve flag value for given context',
        (y: Argv) =>
          y
            .positional('flag-key', { type: 'string', demandOption: true })
            .option('entity', {
              type: 'string',
              describe: 'Targeting key field (e.g. targeting_key)',
              demandOption: true,
            })
            .option('entity-value', {
              type: 'string',
              describe: 'Targeting key value (e.g. user-123)',
              demandOption: true,
            })
            .option('context', {
              type: 'string',
              array: true,
              describe: 'Additional context key=value pair',
            })
            .option('client', { type: 'string', describe: 'Client name for resolution' }),
        safely(resolveFlagCmd),
      )
      .command(
        'target <flag-key>',
        'View or update targeting rules',
        (y: Argv) =>
          y
            .positional('flag-key', { type: 'string', demandOption: true })
            .option('add', {
              type: 'string',
              describe: 'Add rule as variant:percentage pairs (e.g. on:80,off:20)',
            })
            .option('targeting-key', {
              type: 'string',
              describe: 'Targeting key for the rule (used with --add)',
            })
            .option('from-file', {
              type: 'string',
              describe: 'Read rule from JSON file',
            }),
        safely(targetFlagCmd),
      )
      .command(
        'archive <flag-key>',
        'Archive a flag',
        (y: Argv) =>
          y.positional('flag-key', { type: 'string', demandOption: true }).option('force', {
            alias: 'f',
            type: 'boolean',
            describe: 'Skip confirmation prompt',
          }),
        safely(archiveFlagCmd),
      )
      .demandCommand(1, 'Run "confidence flags --help" to see available actions.')
      .strict();
  },
  handler() {},
};
