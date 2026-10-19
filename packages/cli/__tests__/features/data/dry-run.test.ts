import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { http, HttpResponse, server } from '@spotify-confidence/testing';
import { buildTestJwt, prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { resetTelemetry } from '@spotify-confidence/core';
import { executeDataRequest, printData } from '@features/data/index.js';
import { metricsRequest } from '@network/metrics.js';
import { requireRecord, requireString } from '@network/metrics-types.js';
import { flushTelemetry, telemetryMiddleware } from '@utils/telemetry.js';
import { captureOutput } from '../../helpers/capture.js';

const TEST_URL = 'https://metrics.eu.confidence.dev/v1/testResources';

function inputFile(contents: string) {
  const dir = mkdtempSync(join(tmpdir(), 'confidence-data-test-'));
  const path = join(dir, 'input.json');
  writeFileSync(path, contents);
  return {
    path,
    [Symbol.dispose]() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

// A feature-like caller validates real input before the shared execution helper.
async function runValidatedFile(argv: Record<string, unknown>) {
  const input = requireRecord(
    JSON.parse(readFileSync(argv['from-file'] as string, 'utf8')),
    'Input',
  );
  requireString(input.displayName, 'displayName');
  await executeDataRequest(
    argv,
    (token) => metricsRequest(token, { path: '/v1/testResources', method: 'POST', body: input }),
    { method: 'POST', path: '/v1/testResources', body: input },
  );
}

afterEach(() => {
  resetTelemetry();
  vi.unstubAllEnvs();
});

describe('Data dry-runs', () => {
  it('previews validated input before auth with no HTTP or file writes', async () => {
    // Arrange
    using _auth = prepareAuthTokens('none');
    using file = inputFile('{"displayName":"Example"}');
    using output = captureOutput();
    const configDir = process.env.CONFIDENCE_CONFIG_DIR!;
    const before = readdirSync(configDir, { recursive: true });
    let calls = 0;
    server.use(
      http.all('*', () => {
        calls++;
        return HttpResponse.json({});
      }),
    );
    const sut = runValidatedFile;

    // Act
    await sut({ 'dry-run': true, 'from-file': file.path, json: true, profile: '../invalid' });

    // Assert
    expect(JSON.parse(output.stdout)).toEqual({
      data: { method: 'POST', path: '/v1/testResources', body: { displayName: 'Example' } },
    });
    expect(output.stderr).toBe('');
    expect(calls).toBe(0);
    expect(readdirSync(configDir, { recursive: true })).toEqual(before);
    expect(readFileSync(file.path, 'utf8')).toBe('{"displayName":"Example"}');
  });

  it.each(['invalid JSON', '[]', '{"displayName":42}'])(
    'still rejects invalid local input %s before preview or auth',
    async (contents) => {
      using _auth = prepareAuthTokens('none');
      using file = inputFile(contents);
      using output = captureOutput();
      const sut = runValidatedFile;

      await expect(sut({ 'dry-run': true, 'from-file': file.path, json: true })).rejects.toThrow();

      expect(output.stdout).toBe('');
      expect(output.stderr).toBe('');
    },
  );

  it('has a useful local preview when none is supplied', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    let calls = 0;
    const sut = executeDataRequest;

    await sut({ 'dry-run': true, json: true }, async () => {
      calls++;
      return { ok: true, data: {} };
    });

    expect(JSON.parse(output.stdout)).toEqual({ data: { dryRun: true } });
    expect(calls).toBe(0);
  });
});

describe('Data request execution', () => {
  it.each(['none', 'expired'] as const)(
    'fails without usable %s credentials before sending',
    async (auth) => {
      using _auth = prepareAuthTokens(auth);
      using output = captureOutput();
      let calls = 0;
      const sut = executeDataRequest;

      await sut({}, async () => {
        calls++;
        return { ok: true, data: {} };
      });

      expect(calls).toBe(0);
      expect(output.stderr).toMatch(/Not logged in|Token expired/u);
      expect(process.exitCode).toBe(1);
    },
  );

  it('sends once and preserves state, errors, and pagination in the JSON envelope', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using file = inputFile('{"displayName":"Example"}');
    using output = captureOutput();
    let calls = 0;
    const data = { state: 'FAILED', error: { message: 'Resource failed' }, nextPageToken: 'next' };
    server.use(
      http.post(TEST_URL, () => {
        calls++;
        return HttpResponse.json(data);
      }),
    );
    const previousExitCode = process.exitCode;
    const sut = runValidatedFile;

    // Act
    await sut({ 'from-file': file.path, json: true });

    // Assert
    expect(JSON.parse(output.stdout)).toEqual({ data });
    expect(output.stderr).toBe('');
    expect(process.exitCode).toBe(previousExitCode);
    expect(calls).toBe(1);
  });

  it('uses the requested auth profile', async () => {
    // Arrange
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();
    const profileDir = join(process.env.CONFIDENCE_CONFIG_DIR!, 'profiles', 'metrics');
    const token = buildTestJwt({ email: 'profile@example.com' });
    mkdirSync(profileDir, { recursive: true });
    writeFileSync(join(profileDir, 'credentials.json'), JSON.stringify({ accessToken: token }));
    server.use(
      http.get(TEST_URL, ({ request }) =>
        HttpResponse.json({
          authorized: request.headers.get('Authorization') === `Bearer ${token}`,
        }),
      ),
    );
    const sut = executeDataRequest;

    // Act
    await sut({ profile: 'metrics', json: true }, (value) =>
      metricsRequest(value, { path: '/v1/testResources' }),
    );

    // Assert
    expect(JSON.parse(output.stdout)).toEqual({ data: { authorized: true } });
  });

  it('prints a sanitized failure, omits arbitrary details, and exits nonzero without replay', async () => {
    // Arrange
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    let calls = 0;
    server.use(
      http.get(TEST_URL, () => {
        calls++;
        return HttpResponse.json(
          {
            code: 7,
            message: 'Denied\n\u001b[31m Bearer private-credential',
            details: [{ secret: 'private' }],
          },
          { status: 403 },
        );
      }),
    );
    const sut = executeDataRequest;

    // Act
    await sut({ json: true }, (token) => metricsRequest(token, { path: '/v1/testResources' }));

    // Assert
    expect(output.stdout).toBe('');
    expect(output.stderr).toContain('Denied');
    expect(output.stderr).not.toContain('private');
    expect(output.stderr).not.toContain('\u001b');
    expect(process.exitCode).toBe(1);
    expect(calls).toBe(1);
  });

  it('reports thrown response validation errors as nonzero failures', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();
    const sut = executeDataRequest;

    await sut({}, async () => {
      throw new Error('Invalid resource response');
    });

    expect(output.stderr).toContain('Invalid resource response');
    expect(process.exitCode).toBe(1);
  });

  it('renders nested resources as readable output when requested', () => {
    using output = captureOutput();
    const sut = printData;

    sut({ name: 'testResources/a', status: { state: 'PENDING' } }, { output: 'table' });

    expect(output.stdout).toContain('Field');
    expect(output.stdout).toContain('testResources/a');
    expect(output.stdout).toContain('PENDING');
    expect(output.stdout).not.toContain('[object Object]');
  });
});

describe('dry-run telemetry suppression', () => {
  it.each([
    ['data', 'entities', 'list'],
    ['data', 'sql', 'preview'],
    ['warehouse', 'list'],
    ['warehouse', 'get'],
  ])('sends no telemetry for %j even when telemetry is enabled', async (...command) => {
    vi.stubEnv('CONFIDENCE_TELEMETRY', 'true');
    let calls = 0;
    server.use(
      http.all('*', () => {
        calls++;
        return HttpResponse.json({ clientSecret: 'test' });
      }),
    );
    const sut = telemetryMiddleware;

    sut({ _: command, telemetry: true, 'dry-run': true });
    await flushTelemetry();

    expect(calls).toBe(0);
  });

  it.each([
    { command: ['flags', 'list'], dryRun: true },
    { command: ['warehouse', 'create'], dryRun: true },
    { command: ['data', 'entities', 'list'], dryRun: false },
  ])('preserves existing telemetry behavior for %j', async ({ command, dryRun }) => {
    vi.stubEnv('CONFIDENCE_TELEMETRY', 'true');
    const steps: string[] = [];
    server.use(
      http.post('https://onboarding.confidence.dev/v1/agentTelemetryKey:acquire', () =>
        HttpResponse.json({ clientSecret: 'test' }),
      ),
      http.post('https://events.eu.confidence.dev/v1/events:publish', async ({ request }) => {
        const body = (await request.json()) as { events: { payload: { step: string } }[] };
        steps.push(body.events[0].payload.step);
        return HttpResponse.json({});
      }),
    );
    const sut = telemetryMiddleware;

    sut({ _: command, telemetry: true, 'dry-run': dryRun });
    await flushTelemetry();

    expect(steps).toEqual([command.join('.')]);
  });
});
