import yargs, { type CommandModule } from 'yargs';

export function createRunner(command: CommandModule) {
  return (args: string[]) =>
    yargs(args)
      .option('json', { type: 'boolean', default: false })
      .option('output', { type: 'string' })
      .option('profile', { type: 'string' })
      .option('dry-run', { type: 'boolean', default: false })
      .command(command)
      .parse();
}
