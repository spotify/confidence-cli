import type { Argv } from 'yargs';
import type { GlobalFlags } from './types.js';
import {
  readConfig,
  getConfigValue,
  setConfigValue,
  resetConfig,
  validKeys,
} from '@features/config/index.js';
import { resolveFormat } from '@output/detect.js';
import { formatJson } from '@output/json.js';
import { formatTable } from '@output/table.js';

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
          setConfigValue(argv.key as string, argv.value as string);
          console.log(`Set ${argv.key} = ${argv.value}`);
        },
      )
      .command(
        'get <key>',
        'Get a config value',
        (y: Argv) => y.positional('key', { type: 'string', demandOption: true }),
        (argv) => {
          const value = getConfigValue(argv.key as string);
          if (value === undefined) {
            console.log(`${argv.key} is not set`);
          } else {
            console.log(value);
          }
        },
      )
      .command(
        'list',
        'Show all config values',
        () => {},
        (argv) => {
          const config = readConfig();
          const format = resolveFormat({
            json: argv.json as boolean | undefined,
            output: argv.output as GlobalFlags['output'],
          });

          if (format === 'json') {
            console.log(formatJson(config));
          } else {
            const entries = Object.entries(config);
            if (entries.length === 0) {
              console.log('No configuration set.');
              return;
            }
            const rows = entries.map(([key, value]) => ({
              key,
              value: String(value),
            }));
            console.log(
              formatTable(rows, [
                { key: 'key', header: 'Key', width: 14 },
                { key: 'value', header: 'Value' },
              ]),
            );
          }
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
