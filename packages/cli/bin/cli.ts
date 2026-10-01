#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const APP_NAME = 'confidence';

const cli = yargs(hideBin(process.argv))
  .scriptName(APP_NAME)
  .usage('$0 <command> [options]')
  .option('json', {
    type: 'boolean',
    default: false,
    describe: 'Force JSON output',
  })
  .option('output', {
    type: 'string',
    choices: ['json', 'table', 'plain'] as const,
    describe: 'Output format',
  })
  .option('project', {
    type: 'string',
    describe: 'Override project (from config)',
  })
  .option('environment', {
    type: 'string',
    describe: 'Override environment (from config)',
  })
  .option('profile', {
    type: 'string',
    describe: 'Use named auth profile',
  })
  .option('no-color', {
    type: 'boolean',
    default: false,
    describe: 'Disable colors',
  })
  .option('dry-run', {
    type: 'boolean',
    default: false,
    describe: 'Preview without executing',
  })
  .option('debug', {
    type: 'boolean',
    default: false,
    describe: 'Verbose/diagnostic output',
  })
  .demandCommand(1, 'Run "confidence --help" to see available commands.')
  .strict()
  .help()
  .version();

cli.parse();
