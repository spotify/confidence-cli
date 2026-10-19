import type { Argv } from 'yargs';
import { noop } from '@spotify-confidence/shared-kernel';
import {
  readConfig,
  getConfigValue,
  setConfigValue,
  resetConfig,
  validKeys,
} from '@features/config/index.js';
import { print, message, fail, extractFlags } from '@output/print.js';
import { dryRunGuard } from '@utils/index.js';

export const configCommand = {
  command: 'config <action>',
  describe: 'Manage persistent configuration',
  builder(yargs: Argv) {
    return yargs
      .command(
        'set <key> <value>',
        'Set a config value',
        (y: Argv) =>
          y
            .positional('key', { type: 'string', demandOption: true })
            .positional('value', { type: 'string', demandOption: true }),
        setCmd,
      )
      .command(
        'get <key>',
        'Get a config value',
        (y: Argv) => y.positional('key', { type: 'string', demandOption: true }),
        getCmd,
      )
      .command('list', 'Show all config values', noop, listCmd)
      .command('reset', 'Reset all config to defaults', noop, resetCmd)
      .demandCommand(
        1,
        `Available actions: set, get, list, reset\nValid keys: ${validKeys().join(', ')}`,
      )
      .strict();
  },
  handler() {},
};

function setCmd(argv: Record<string, unknown>): void {
  try {
    if (dryRunGuard(argv, { action: 'set', key: argv.key, value: argv.value })) return;

    setConfigValue(argv.key as string, argv.value as string);
    message(`Set ${argv.key} = ${argv.value}`);
  } catch (err) {
    fail((err as Error).message);
  }
}

function getCmd(argv: Record<string, unknown>): void {
  try {
    const value = getConfigValue(argv.key as string);
    if (value === undefined) {
      message(`${argv.key} is not set`);
    } else {
      message(value);
    }
  } catch (err) {
    fail((err as Error).message);
  }
}

function listCmd(argv: Record<string, unknown>): void {
  const config = readConfig();
  print({
    data: config,
    columns: [
      { key: 'key', header: 'Key', width: 14 },
      { key: 'value', header: 'Value' },
    ],
    flags: extractFlags(argv),
    empty: 'No configuration set.',
  });
}

function resetCmd(argv: Record<string, unknown>): void {
  if (dryRunGuard(argv, { action: 'reset' })) return;

  resetConfig();
  message('Configuration reset.');
}
