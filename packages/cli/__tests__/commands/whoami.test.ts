import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { whoamiCommand } from '@commands/whoami.js';
import { captureOutput } from '../helpers/capture.js';
import { createRunner } from '../helpers/run-command.js';

const run = createRunner(whoamiCommand);

describe('whoami', () => {
  it('prints user info when logged in', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['whoami']);

    expect(output.stdout).toContain('existing@example.com');
    expect(process.exitCode).not.toBe(1);
  });

  it('fails with expired message when token is expired', async () => {
    using _auth = prepareAuthTokens('expired');
    using output = captureOutput();

    await run(['whoami']);

    expect(output.stderr).toContain('Run "confidence login"');
    expect(process.exitCode).toBe(1);
  });

  it('fails with not-logged-in message when no credentials exist', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await run(['whoami']);

    expect(output.stderr).toContain('Not logged in');
    expect(process.exitCode).toBe(1);
  });

  it('never triggers a browser login', async () => {
    using _auth = prepareAuthTokens('expired');
    using _output = captureOutput();

    await run(['whoami']);

    expect(_output.stdout).not.toContain('Opening browser');
  });
});
