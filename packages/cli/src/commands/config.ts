import type { Argv } from 'yargs';
import {
  readConfig,
  getConfigValue,
  setConfigValue,
  resetConfig,
  validKeys,
} from '@features/config/index.js';
import { print, message, fail, extractFlags } from '@output/print.js';

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
        (argv) => {
          try {
            setConfigValue(argv.key as string, argv.value as string);
            message(`Set ${argv.key} = ${argv.value}`);
          } catch (err) {
            fail((err as Error).message);
          }
        },
      )
      .command(
        'get <key>',
        'Get a config value',
        (y: Argv) => y.positional('key', { type: 'string', demandOption: true }),
        (argv) => {
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
        },
      )
      .command(
        'list',
        'Show all config values',
        () => {},
        (argv) => {
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
        },
      )
      .command(
        'reset',
        'Reset all config to defaults',
        () => {},
        () => {
          resetConfig();
          message('Configuration reset.');
        },
      )
      .demandCommand(
        1,
        `Available actions: set, get, list, reset\nValid keys: ${validKeys().join(', ')}`,
      )
      .strict();
  },
  handler() {},
};
