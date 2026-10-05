import type { Argv } from 'yargs';
import { QUICKSTART_BUILDER, launchQuickstart } from '@features/quickstart/index.js';
import {
  listEvents,
  getEvent,
  createEvent,
  trackEvent,
  validateEventData,
} from '@features/events/index.js';
import { safely } from '../utils/safely.js';

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
      .command(
        'list',
        'List event definitions',
        (y: Argv) =>
          y
            .option('page-size', { type: 'number', describe: 'Results per page', default: 25 })
            .option('page-token', { type: 'string', describe: 'Pagination token' }),
        safely(listEvents),
      )
      .command(
        'get <name>',
        'Get an event definition',
        (y: Argv) => y.positional('name', { type: 'string', demandOption: true }),
        safely(getEvent),
      )
      .command(
        'create',
        'Create an event definition',
        (y: Argv) =>
          y
            .option('name', { type: 'string', describe: 'Event display name', demandOption: true })
            .option('description', { type: 'string', describe: 'Event description' })
            .option('field', {
              type: 'string',
              array: true,
              describe: 'Field spec as name:TYPE (e.g. page:STRING)',
            })
            .option('from-file', { type: 'string', describe: 'Read definition from JSON file' }),
        safely(createEvent),
      )
      .command(
        'track',
        'Publish an event',
        (y: Argv) =>
          y
            .option('event', {
              type: 'string',
              describe: 'Event definition name',
              demandOption: true,
            })
            .option('data', { type: 'string', describe: 'Event payload as JSON' })
            .option('from-file', { type: 'string', describe: 'Read payload from JSON file' }),
        safely(trackEvent),
      )
      .command(
        'validate',
        'Validate event data against a definition',
        (y: Argv) =>
          y
            .option('event', {
              type: 'string',
              describe: 'Event definition name',
              demandOption: true,
            })
            .option('data', { type: 'string', describe: 'Event payload as JSON' })
            .option('from-file', { type: 'string', describe: 'Read payload from JSON file' }),
        safely(validateEventData),
      )
      .demandCommand(
        1,
        'Available actions: setup, list, get, create, track, validate. Run "confidence events --help" for details.',
      )
      .strict();
  },
  handler() {},
};
