import type { CommandModule } from 'yargs';

export type GlobalFlags = {
  json: boolean;
  output: 'json' | 'table' | 'plain';
  project?: string;
  environment?: string;
  profile?: string;
  debug: boolean;
  'dry-run': boolean;
  'no-color': boolean;
};

export type Command<T = object> = CommandModule<GlobalFlags, GlobalFlags & T>;
