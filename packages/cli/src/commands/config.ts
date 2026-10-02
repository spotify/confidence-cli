import type { Argv } from 'yargs';
import {
  readConfig,
  getConfigValue,
  setConfigValue,
  resetConfig,
  validKeys,
} from '@features/config/index.js';
import { print, extractFlags } from '@output/print.js';

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
            console.log(`Set ${argv.key} = ${argv.value}`);
          } catch (err) {
            console.error((err as Error).message);
            process.exitCode = 1;
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
              console.log(`${argv.key} is not set`);
            } else {
              console.log(value);
            }
          } catch (err) {
            console.error((err as Error).message);
            process.exitCode = 1;
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
          });
        },
      )
      .command(
        'reset',
        'Reset all config to defaults',
        () => {},
        () => {
          resetConfig();
          console.log('Configuration reset.');
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
