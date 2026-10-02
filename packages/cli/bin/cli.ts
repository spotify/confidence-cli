#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  loginCommand,
  logoutCommand,
  whoamiCommand,
  configCommand,
  eventsCommand,
  flagsCommand,
  recordingsCommand,
  quickstartCommand,
  mcpCommand,
  sdkCommand,
} from '../src/commands/index.js';

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
    hidden: true,
  })
  .option('environment', {
    type: 'string',
    describe: 'Override environment (from config)',
    hidden: true,
  })
  .option('profile', {
    type: 'string',
    describe: 'Use named auth profile',
  })
  .option('no-color', {
    type: 'boolean',
    default: false,
    describe: 'Disable colors',
    hidden: true,
  })
  .option('dry-run', {
    type: 'boolean',
    default: false,
    describe: 'Preview without executing',
    hidden: true,
  })
  .option('debug', {
    type: 'boolean',
    default: false,
    describe: 'Verbose/diagnostic output',
    hidden: true,
  })
  .command(loginCommand)
  .command(logoutCommand)
  .command(whoamiCommand)
  .command(configCommand)
  .command(eventsCommand)
  .command(flagsCommand)
  .command(recordingsCommand)
  .command(quickstartCommand)
  .command(mcpCommand)
  .command(sdkCommand)
  .demandCommand(1, 'Run "confidence --help" to see available commands.')
  .strict()
  .help()
  .version();

cli.parse();
