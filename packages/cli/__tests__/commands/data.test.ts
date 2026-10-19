import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import yargs from 'yargs';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { dataCommand } from '@commands/index.js';

function run(args: string[]) {
  let output = '';
  const sut = yargs(args).scriptName('confidence').command(dataCommand).help().exitProcess(false);
  return sut
    .parseAsync(args, (_error: Error | undefined, _argv: unknown, text: string) => {
      output = text;
    })
    .then(() => output);
}

describe('data command group', () => {
  it('is registered in the real root help alongside existing commands', () => {
    using _auth = prepareAuthTokens('none');
    const sut = fileURLToPath(new URL('../../bin/cli.ts', import.meta.url));

    const output = execFileSync(process.execPath, ['--import', 'tsx', sut, '--help'], {
      encoding: 'utf8',
      env: { ...process.env, CONFIDENCE_TELEMETRY: 'false' },
    });

    expect(output).toContain('confidence data');
    expect(output).toContain('confidence warehouse');
    expect(output).toContain('confidence flags');
  });

  it('shows help without authentication or placeholder API subcommands', async () => {
    using _auth = prepareAuthTokens('none');
    const sut = run;

    const output = await sut(['data', '--help']);

    expect(output).toContain('confidence data <command>');
    expect(output).not.toMatch(/onboard|discover|proposal|workflow/iu);
  });

  it('advertises only list and get under entities without authentication', async () => {
    using _auth = prepareAuthTokens('none');
    const sut = run;

    const output = await sut(['data', 'entities', '--help']);

    expect(output).toContain('entities list');
    expect(output).toContain('entities get');
    expect(output).not.toMatch(/create|update|delete|onboard|workflow/iu);
  });

  it('shows guidance when invoked without a subcommand', async () => {
    const sut = run;
    expect(await sut(['data'])).toContain('confidence data --help');
  });

  it('rejects unimplemented subcommands', async () => {
    const sut = run;
    expect(await sut(['data', 'invented'])).toContain('Unknown argument: invented');
  });
});
