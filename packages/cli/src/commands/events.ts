import type { Argv } from 'yargs';
import { QUICKSTART_BUILDER, launchQuickstart } from '@features/quickstart/index.js';
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  eventUsage,
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
        (y: Argv) => y.option('page-token', { type: 'string', describe: 'Pagination token' }),
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
            .option('name', { type: 'string', describe: 'Event definition ID', demandOption: true })
            .option('field', {
              type: 'string',
              array: true,
              describe: 'Field spec as name:type (e.g. amount:double, page:string)',
            })
            .option('from-file', { type: 'string', describe: 'Read schema from JSON file' }),
        safely(createEvent),
      )
      .command(
        'update <name>',
        'Add fields to an event definition',
        (y: Argv) =>
          y.positional('name', { type: 'string', demandOption: true }).option('field', {
            type: 'string',
            array: true,
            describe: 'Field spec as name:type (e.g. referrer:string)',
            demandOption: true,
          }),
        safely(updateEvent),
      )
      .command(
        'delete <name>',
        'Delete an event definition',
        (y: Argv) => y.positional('name', { type: 'string', demandOption: true }),
        safely(deleteEvent),
      )
      .command(
        'usage <name>',
        'Show event publish and validation stats',
        (y: Argv) =>
          y
            .positional('name', { type: 'string', demandOption: true })
            .option('days', { type: 'number', describe: 'Number of days (1-7)', default: 7 }),
        safely(eventUsage),
      )
      .demandCommand(
        1,
        'Available actions: setup, list, get, create, update, delete, usage. Run "confidence events --help" for details.',
      )
      .strict();
  },
  handler() {},
};
