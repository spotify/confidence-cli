import { message, error, fail, extractFlags, print } from '@output/print.js';

describe('message', () => {
  it('writes text to stdout with a trailing newline', () => {
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    message('hello world');

    expect(spy).toHaveBeenCalledWith('hello world\n');
  });
});

describe('error', () => {
  it('writes text to stderr with a trailing newline', () => {
    const spy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    error('something went wrong');

    expect(spy).toHaveBeenCalledWith('something went wrong\n');
  });
});

describe('fail', () => {
  afterEach(() => {
    process.exitCode = 0;
  });

  it('writes to stderr and sets exitCode to 1', () => {
    vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    fail('fatal error');

    expect(process.exitCode).toBe(1);
  });
});

describe('extractFlags', () => {
  it('extracts json and output from argv', () => {
    const sut = extractFlags({ json: true, output: 'table', other: 'ignored' });

    expect(sut).toEqual({ json: true, output: 'table' });
  });

  it('returns undefined for missing flags', () => {
    expect(extractFlags({})).toEqual({ json: undefined, output: undefined });
  });
});

describe('print', () => {
  let spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  });

  it('renders an array as a table', () => {
    print({
      data: [
        { name: 'confidence-flags', url: 'https://example.com/flags' },
        { name: 'confidence-docs', url: 'https://example.com/docs' },
      ],
      columns: [
        { key: 'name', header: 'Server', width: 20 },
        { key: 'url', header: 'URL' },
      ],
      flags: { output: 'table' },
    });

    const output = (spy.mock.calls[0] as string[])[0];
    expect(output).toContain('Server');
    expect(output).toContain('confidence-flags');
    expect(output).toContain('confidence-docs');
  });

  it('renders an array as JSON', () => {
    const data = [{ name: 'test-server', url: 'https://example.com' }];

    print({
      data,
      columns: [
        { key: 'name', header: 'Server' },
        { key: 'url', header: 'URL' },
      ],
      flags: { json: true },
    });

    const output = (spy.mock.calls[0] as string[])[0];
    const parsed = JSON.parse(output);
    expect(parsed.data).toEqual(data);
  });

  it('renders a key-value object as a table', () => {
    print({
      data: { email: 'user@example.com', region: 'EU' },
      columns: [
        { key: 'key', header: 'Field', width: 10 },
        { key: 'value', header: 'Value' },
      ],
      flags: { output: 'table' },
    });

    const output = (spy.mock.calls[0] as string[])[0];
    expect(output).toContain('email');
    expect(output).toContain('user@example.com');
  });

  it('prints "No results." for an empty object', () => {
    print({
      data: {},
      columns: [
        { key: 'key', header: 'Key' },
        { key: 'value', header: 'Value' },
      ],
      flags: { output: 'table' },
    });

    const output = (spy.mock.calls[0] as string[])[0];
    expect(output).toContain('No results.');
  });

  it('prints "No results." for an empty array', () => {
    print({
      data: [],
      columns: [
        { key: 'name', header: 'Server' },
        { key: 'url', header: 'URL' },
      ],
      flags: { output: 'table' },
    });

    const output = (spy.mock.calls[0] as string[])[0];
    expect(output).toContain('No results.');
  });

  it('uses a custom empty for an empty object', () => {
    print({
      data: {},
      columns: [
        { key: 'key', header: 'Key' },
        { key: 'value', header: 'Value' },
      ],
      flags: { output: 'table' },
      empty: 'No configuration set.',
    });

    const output = (spy.mock.calls[0] as string[])[0];
    expect(output).toContain('No configuration set.');
  });

  it('uses a custom empty for an empty array', () => {
    print({
      data: [],
      columns: [
        { key: 'name', header: 'Server' },
        { key: 'url', header: 'URL' },
      ],
      flags: { output: 'table' },
      empty: 'No servers configured.',
    });

    const output = (spy.mock.calls[0] as string[])[0];
    expect(output).toContain('No servers configured.');
  });
});
