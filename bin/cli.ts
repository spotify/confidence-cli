#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { defaultCommand, helpCommand } from '../src/commands/index.js';
import { APP_NAME } from '../src/lib/meta.js';

const cli = yargs(hideBin(process.argv))
  .scriptName(APP_NAME)
  .usage('$0 [command]')
  .option('dry-run', {
    type: 'boolean',
    default: false,
    describe: 'Run without making real API calls',
  })
  .option('debug', {
    type: 'boolean',
    default: false,
    describe: 'Enable debug output and preserve terminal history',
  })
  .option('dir', {
    type: 'string',
    describe: 'Project directory to run the wizard in',
    normalize: true,
  })
  .option('no-telemetry', {
    type: 'boolean',
    default: false,
    describe: 'Disable anonymous usage telemetry',
  })
  .command(defaultCommand.name, defaultCommand.description, () => {}, defaultCommand.handler)
  .command('start', defaultCommand.description, () => {}, defaultCommand.handler)
  .command(helpCommand.name, helpCommand.description, () => {}, helpCommand.handler)
  .help(false)
  .version(false)
  .strict();

cli.parse();
