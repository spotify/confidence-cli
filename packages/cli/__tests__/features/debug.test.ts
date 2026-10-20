import { debug, debugMiddleware, withDebug } from '@utils/index.js';
import { captureOutput } from '../helpers/capture.js';
import { saveEnv } from '../helpers/env.js';

describe('debugLog', () => {
  it('writes to stderr when DEBUG is set', () => {
    using _env = saveEnv('DEBUG');
    using output = captureOutput();
    process.env.DEBUG = 'true';

    debug('test', 'hello');

    expect(output.stderr).toBe('[debug] test: hello\n');
  });

  it('writes nothing when DEBUG is not set', () => {
    using _env = saveEnv('DEBUG');
    using output = captureOutput();
    delete process.env.DEBUG;

    debug('test', 'hello');

    expect(output.stderr).toBe('');
  });
});

describe('withDebug', () => {
  it('logs fn.name when no formatter is provided', async () => {
    using _env = saveEnv('DEBUG');
    using output = captureOutput();
    process.env.DEBUG = 'true';
    async function myOperation() {
      return 42;
    }
    const sut = withDebug(myOperation);

    await sut();

    expect(output.stderr).toContain('[debug] call: myOperation');
    expect(output.stderr).toContain('[debug] timing: myOperation completed in');
  });

  it('logs timing even when the wrapped function rejects', async () => {
    using _env = saveEnv('DEBUG');
    using output = captureOutput();
    process.env.DEBUG = 'true';
    async function failingOp() {
      throw new Error('boom');
    }
    const sut = withDebug(failingOp);

    await expect(sut()).rejects.toThrow('boom');

    expect(output.stderr).toContain('[debug] call: failingOp');
    expect(output.stderr).toContain('[debug] timing: failingOp completed in');
  });

  it('includes fn.name and formatted args when a formatter is provided', async () => {
    using _env = saveEnv('DEBUG');
    using output = captureOutput();
    process.env.DEBUG = 'true';
    async function callApi(method: string, path: string) {
      return { method, path };
    }
    const sut = withDebug(callApi, (method, path) => `${method} ${path}`);

    await sut('GET', '/v1/flags');

    expect(output.stderr).toContain('[debug] call: callApi GET /v1/flags');
    expect(output.stderr).toContain('[debug] timing: callApi GET /v1/flags completed in');
  });
});

describe('debugMiddleware', () => {
  it('sets process.env.DEBUG when --debug is passed', () => {
    using _env = saveEnv('DEBUG');
    using _output = captureOutput();

    debugMiddleware({ debug: true, _: ['flags', 'list'] });

    expect(process.env.DEBUG).toBe('true');
  });

  it('emits command and args to stderr', () => {
    using _env = saveEnv('DEBUG');
    using output = captureOutput();

    debugMiddleware({ debug: true, _: ['flags', 'create'], 'flag-key': 'dark-mode' });

    expect(output.stderr).toContain('[debug] command: flags create');
    expect(output.stderr).toContain('[debug] args:');
    expect(output.stderr).toContain('dark-mode');
  });

  it('redacts sensitive arg values', () => {
    using _env = saveEnv('DEBUG');
    using output = captureOutput();

    debugMiddleware({
      debug: true,
      _: ['warehouse', 'create'],
      'config-json': '{"password":"s3cret"}',
      'from-file': '/etc/shadow',
      'crypto-key-id': 'projects/my-key',
      sql: 'SELECT * FROM users',
      'flag-key': 'dark-mode',
    });

    expect(output.stderr).toContain('config-json=[REDACTED]');
    expect(output.stderr).toContain('from-file=[REDACTED]');
    expect(output.stderr).toContain('crypto-key-id=[REDACTED]');
    expect(output.stderr).toContain('sql=[REDACTED]');
    expect(output.stderr).toContain('flag-key="dark-mode"');
    expect(output.stderr).not.toContain('s3cret');
    expect(output.stderr).not.toContain('/etc/shadow');
  });

  it('does nothing when --debug is false', () => {
    using _env = saveEnv('DEBUG');
    using output = captureOutput();

    debugMiddleware({ debug: false, _: [] });

    expect(process.env.DEBUG).toBeUndefined();
    expect(output.stderr).toBe('');
  });
});
