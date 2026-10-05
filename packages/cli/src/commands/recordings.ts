import type { Argv } from 'yargs';
import { QUICKSTART_BUILDER, launchQuickstart } from '@features/quickstart/index.js';
import {
  listPolicies,
  createPolicy,
  getPolicy,
  addRule,
  enableRule,
  disableRule,
  showTargetingKeys,
  addTargetingKey,
} from '@features/recordings/index.js';
import { safely } from '../utils/safely.js';

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
      .command('policy <action>', 'Manage recording policies', (y: Argv) =>
        y
          .command(
            'list',
            'List recording policies',
            (yy: Argv) => yy.option('page-token', { type: 'string', describe: 'Pagination token' }),
            safely(listPolicies),
          )
          .command(
            'create',
            'Create a recording policy',
            (yy: Argv) =>
              yy
                .option('display-name', {
                  type: 'string',
                  describe: 'Policy display name',
                })
                .option('client-name', {
                  type: 'string',
                  describe: 'Client resource name (e.g. clients/123)',
                })
                .option('from-file', {
                  type: 'string',
                  describe: 'Read params from JSON file',
                })
                .check((argv) => {
                  if (!argv['from-file'] && (!argv['display-name'] || !argv['client-name'])) {
                    throw new Error(
                      '--display-name and --client-name are required (or use --from-file)',
                    );
                  }
                  return true;
                }),
            safely(createPolicy),
          )
          .command(
            'get <policy>',
            'Get recording policy details',
            (yy: Argv) =>
              yy.positional('policy', {
                type: 'string',
                describe: 'Policy resource name',
                demandOption: true,
              }),
            safely(getPolicy),
          )
          .demandCommand(1, 'Available actions: list, create, get')
          .strict(),
      )
      .command('rule <action>', 'Manage recording rules', (y: Argv) =>
        y
          .command(
            'add',
            'Add a recording rule to a policy',
            (yy: Argv) =>
              yy
                .option('policy', {
                  type: 'string',
                  describe: 'Policy resource name',
                })
                .option('display-name', {
                  type: 'string',
                  describe: 'Rule display name',
                  default: 'Record all visitors',
                })
                .option('targeting-key', {
                  type: 'string',
                  describe: 'Targeting key selector (e.g. visitor_id)',
                })
                .option('audience-percentage', {
                  type: 'number',
                  describe: 'Stable audience percentage (0-100)',
                  default: 100,
                })
                .option('sample-rate', {
                  type: 'number',
                  describe: 'Session sample rate (0-1)',
                  default: 1,
                })
                .option('enabled', {
                  type: 'boolean',
                  describe: 'Enable the rule immediately',
                  default: true,
                })
                .option('from-file', {
                  type: 'string',
                  describe: 'Read params from JSON file',
                })
                .check((argv) => {
                  if (!argv['from-file'] && (!argv.policy || !argv['targeting-key'])) {
                    throw new Error(
                      '--policy and --targeting-key are required (or use --from-file)',
                    );
                  }
                  return true;
                }),
            safely(addRule),
          )
          .command(
            'enable <rule>',
            'Enable a recording rule',
            (yy: Argv) =>
              yy.positional('rule', {
                type: 'string',
                describe: 'Rule resource name',
                demandOption: true,
              }),
            safely(enableRule),
          )
          .command(
            'disable <rule>',
            'Disable a recording rule',
            (yy: Argv) =>
              yy.positional('rule', {
                type: 'string',
                describe: 'Rule resource name',
                demandOption: true,
              }),
            safely(disableRule),
          )
          .demandCommand(1, 'Available actions: add, enable, disable')
          .strict(),
      )
      .command('targeting-key <action>', 'Manage targeting keys', (y: Argv) =>
        y
          .command(
            'show <client>',
            'Show context schema and targeting keys for a client',
            (yy: Argv) =>
              yy.positional('client', {
                type: 'string',
                describe: 'Client display name',
                demandOption: true,
              }),
            safely(showTargetingKeys),
          )
          .command(
            'add',
            'Add a context field as targeting key',
            (yy: Argv) =>
              yy
                .option('field-name', {
                  type: 'string',
                  describe: 'Field name (e.g. visitor_id)',
                })
                .option('field-type', {
                  type: 'string',
                  describe: 'Field type (e.g. string)',
                })
                .option('is-entity', {
                  type: 'boolean',
                  describe: 'Mark as entity field',
                  default: true,
                })
                .option('from-file', {
                  type: 'string',
                  describe: 'Read params from JSON file',
                })
                .check((argv) => {
                  if (!argv['from-file'] && (!argv['field-name'] || !argv['field-type'])) {
                    throw new Error(
                      '--field-name and --field-type are required (or use --from-file)',
                    );
                  }
                  return true;
                }),
            safely(addTargetingKey),
          )
          .demandCommand(1, 'Available actions: show, add')
          .strict(),
      )
      .demandCommand(
        1,
        'Available actions: setup, policy, rule, targeting-key. Run "confidence recordings --help" for details.',
      )
      .strict();
  },
  handler() {},
};
