import yargs from 'yargs';
import { http, HttpResponse, server, EVENTS_EU_BASE } from '@spotify-confidence/testing';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { eventsCommand } from '@commands/events.js';
import { captureOutput } from '../helpers/capture.js';

function run(args: string[]) {
  return yargs(args)
    .option('json', { type: 'boolean', default: false })
    .option('output', { type: 'string' })
    .option('profile', { type: 'string' })
    .option('dry-run', { type: 'boolean', default: false })
    .command(eventsCommand)
    .parse();
}

describe('events list', () => {
  it('outputs event definitions as JSON', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'list', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'page-viewed' })]),
    );
  });

  it('outputs event definitions as a table', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'list', '--output', 'table']);

    expect(output.stdout).toContain('page-viewed');
    expect(output.stdout).toContain('Page Viewed');
    expect(output.stdout).toContain('Name');
  });

  it('shows empty message when no events exist', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${EVENTS_EU_BASE}/v1/events`, () => {
        return HttpResponse.json({ items: [] });
      }),
    );

    await run(['events', 'list', '--output', 'table']);

    expect(output.stdout).toContain('No event definitions found.');
  });

  it('forwards pagination params', async () => {
    using _auth = prepareAuthTokens('valid');
    using _output = captureOutput();
    let capturedParams: Record<string, string> = {};
    server.use(
      http.get(`${EVENTS_EU_BASE}/v1/events`, (info) => {
        const url = new URL(info.request.url);
        capturedParams = Object.fromEntries(url.searchParams);
        return HttpResponse.json({ items: [] });
      }),
    );

    await run(['events', 'list', '--page-size', '10', '--page-token', 'abc123']);

    expect(capturedParams).toEqual(
      expect.objectContaining({ pageSize: '10', pageToken: 'abc123' }),
    );
  });

  it('fails when not logged in', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    await run(['events', 'list', '--json']);

    expect(output.stderr).toContain('Not logged in');
  });
});

describe('events get', () => {
  it('outputs event definition as JSON', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'get', 'page-viewed', '--json']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data).toEqual(
      expect.objectContaining({ name: 'page-viewed', displayName: 'Page Viewed' }),
    );
  });

  it('reports not found for missing events', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.get(`${EVENTS_EU_BASE}/v1/events/:name`, () => {
        return HttpResponse.json({ code: 404, message: 'Not Found' }, { status: 404 });
      }),
    );

    await run(['events', 'get', 'missing']);

    expect(output.stderr).toContain('Event definition "missing" not found.');
  });
});

describe('events create', () => {
  it('creates an event definition', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run([
      'events',
      'create',
      '--name',
      'Purchase',
      '--description',
      'Track purchases',
      '--field',
      'amount:NUMBER',
      '--field',
      'item:STRING',
      '--json',
    ]);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.data).toEqual(expect.objectContaining({ name: 'new-event' }));
  });

  it('prints request body in dry-run mode', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'create', '--name', 'Test Event', '--field', 'page:STRING', '--dry-run']);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.displayName).toBe('Test Event');
    expect(parsed.fields).toEqual([{ name: 'page', type: 'STRING' }]);
  });

  it('fails on invalid field spec', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'create', '--name', 'Bad Event', '--field', 'no-type']);

    expect(output.stderr).toContain('Invalid field format');
  });
});

describe('events track', () => {
  it('publishes an event', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'track', '--event', 'page-viewed', '--data', '{"url":"/home"}']);

    expect(output.stdout).toContain('Event published successfully.');
  });

  it('prints request body in dry-run mode', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run([
      'events',
      'track',
      '--event',
      'page-viewed',
      '--data',
      '{"url":"/home"}',
      '--dry-run',
    ]);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.eventDefinition).toBe('page-viewed');
    expect(parsed.payload).toEqual({ url: '/home' });
  });

  it('fails on invalid JSON in --data', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'track', '--event', 'page-viewed', '--data', 'not-json']);

    expect(output.stderr).toContain('Invalid JSON in --data');
  });

  it('fails when no data source is provided', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'track', '--event', 'page-viewed']);

    expect(output.stderr).toContain('Provide event data via --data or --from-file');
  });
});

describe('events validate', () => {
  it('reports valid event data', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run(['events', 'validate', '--event', 'page-viewed', '--data', '{"url":"/home"}']);

    expect(output.stdout).toContain('Event data is valid.');
  });

  it('reports validation errors', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    server.use(
      http.post(`${EVENTS_EU_BASE}/v1/events\\:validate`, () => {
        return HttpResponse.json({
          valid: false,
          errors: [{ field: 'url', message: 'Required field missing' }],
        });
      }),
    );

    await run([
      'events',
      'validate',
      '--event',
      'page-viewed',
      '--data',
      '{}',
      '--output',
      'table',
    ]);

    expect(output.stdout).toContain('url');
    expect(output.stdout).toContain('Required field missing');
    expect(process.exitCode).toBe(1);
  });

  it('prints request body in dry-run mode', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    await run([
      'events',
      'validate',
      '--event',
      'page-viewed',
      '--data',
      '{"url":"/home"}',
      '--dry-run',
    ]);

    const parsed = JSON.parse(output.stdout);
    expect(parsed.eventDefinition).toBe('page-viewed');
  });
});
