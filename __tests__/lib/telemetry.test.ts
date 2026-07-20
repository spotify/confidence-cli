import { http, HttpResponse } from 'msw';
import { server } from '../msw/server.js';
import { initTelemetry, getTelemetry, resetTelemetry } from '@lib/telemetry.js';

beforeEach(() => {
  process.env['CONFIDENCE_TELEMETRY'] = 'true';
});

afterEach(() => {
  resetTelemetry();
  delete process.env['CONFIDENCE_TELEMETRY'];
});

describe('when telemetry is not initialized', () => {
  it('returns a noop client that does nothing', () => {
    const sut = getTelemetry();
    expect(() => sut.track({ step: 'test.step', action: 'test' })).not.toThrow();
  });
});

describe('when telemetry is initialized', () => {
  it('acquires a key and publishes events', async () => {
    const published: unknown[] = [];

    server.use(
      http.post(
        'https://onboarding.confidence.dev/v1/agentTelemetryKey:acquire',
        async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ session_id: 'test-session-id' });
          return HttpResponse.json({ clientSecret: 'acquired-key' });
        },
      ),
      http.post('https://events.eu.confidence.dev/v1/events:publish', async ({ request }) => {
        const body = await request.json();
        published.push(body);
        return HttpResponse.json({});
      }),
    );

    initTelemetry({ sessionId: 'test-session-id' });
    const sut = getTelemetry();

    sut.track({ step: 'welcome.menu', action: 'start' });

    await vi.waitFor(() => {
      expect(published).toHaveLength(1);
    });

    const event = published[0] as Record<string, unknown>;
    expect(event).toMatchObject({
      client_secret: 'acquired-key',
      events: [
        {
          event_definition: 'eventDefinitions/agent-telemetry',
          payload: {
            session_id: 'test-session-id',
            skill: 'wizard',
            step: 'welcome.menu',
            action: 'start',
            sentiment: 'neutral',
            completion: 'in_progress',
          },
        },
      ],
    });
  });

  it('sends events to the correct regional endpoint after updateRegion', async () => {
    const euPublished: unknown[] = [];
    const usPublished: unknown[] = [];

    server.use(
      http.post('https://events.eu.confidence.dev/v1/events:publish', async ({ request }) => {
        euPublished.push(await request.json());
        return HttpResponse.json({});
      }),
      http.post('https://events.us.confidence.dev/v1/events:publish', async ({ request }) => {
        usPublished.push(await request.json());
        return HttpResponse.json({});
      }),
    );

    initTelemetry({ sessionId: 'region-test' });
    const sut = getTelemetry();

    sut.track({ step: 'warmup', action: 'init' });

    await vi.waitFor(() => {
      expect(euPublished).toHaveLength(1);
    });

    sut.updateRegion('US');
    sut.track({ step: 'authenticate.result', action: 'completed' });

    await vi.waitFor(() => {
      expect(usPublished).toHaveLength(1);
    });
  });

  it('applies default sentiment and completion values', async () => {
    const published: unknown[] = [];

    server.use(
      http.post('https://events.eu.confidence.dev/v1/events:publish', async ({ request }) => {
        const body = await request.json();
        published.push(body);
        return HttpResponse.json({});
      }),
    );

    initTelemetry({ sessionId: 'defaults-test' });
    getTelemetry().track({ step: 'test.step', action: 'test' });

    await vi.waitFor(() => {
      expect(published).toHaveLength(1);
    });

    const payload = (published[0] as { events: [{ payload: Record<string, string> }] }).events[0]
      .payload;
    expect(payload.sentiment).toBe('neutral');
    expect(payload.completion).toBe('in_progress');
  });

  it('uses explicit sentiment and completion when provided', async () => {
    const published: unknown[] = [];

    server.use(
      http.post('https://events.eu.confidence.dev/v1/events:publish', async ({ request }) => {
        const body = await request.json();
        published.push(body);
        return HttpResponse.json({});
      }),
    );

    initTelemetry({ sessionId: 'explicit-test' });
    getTelemetry().track({
      step: 'done.action',
      action: 'exit',
      sentiment: 'positive',
      completion: 'done',
    });

    await vi.waitFor(() => {
      expect(published).toHaveLength(1);
    });

    const payload = (published[0] as { events: [{ payload: Record<string, string> }] }).events[0]
      .payload;
    expect(payload.sentiment).toBe('positive');
    expect(payload.completion).toBe('done');
  });
});

describe('when key acquisition fails', () => {
  it('silently drops all events', async () => {
    const published: unknown[] = [];

    server.use(
      http.post('https://onboarding.confidence.dev/v1/agentTelemetryKey:acquire', () => {
        return HttpResponse.json({ error: 'forbidden' }, { status: 403 });
      }),
      http.post('https://events.eu.confidence.dev/v1/events:publish', async ({ request }) => {
        published.push(await request.json());
        return HttpResponse.json({});
      }),
    );

    initTelemetry({ sessionId: 'fail-test' });
    const sut = getTelemetry();

    sut.track({ step: 'welcome.menu', action: 'start' });
    sut.track({ step: 'system-check.result', action: 'passed' });

    await new Promise((r) => setTimeout(r, 200));
    expect(published).toHaveLength(0);
  });
});

describe('when event publishing fails', () => {
  it('does not throw', async () => {
    server.use(
      http.post('https://events.eu.confidence.dev/v1/events:publish', () => {
        return HttpResponse.error();
      }),
    );

    initTelemetry({ sessionId: 'publish-fail-test' });
    const sut = getTelemetry();

    expect(() => sut.track({ step: 'test', action: 'test' })).not.toThrow();
    await new Promise((r) => setTimeout(r, 200));
  });
});
