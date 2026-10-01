import type { CommandModule } from 'yargs';

export type Command = {
  name: string;
  description: string;
  aliases?: string[];
  handler: CommandModule['handler'];
};
