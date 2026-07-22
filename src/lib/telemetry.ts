import { env, isCI } from './env.js';

const TELEMETRY_KEY_URL = env(
  'CONFIDENCE_TELEMETRY_KEY_URL',
  'https://onboarding.confidence.dev/v1/agentTelemetryKey:acquire',
);

const TELEMETRY_EVENTS_URL_TEMPLATE = env(
  'CONFIDENCE_TELEMETRY_EVENTS_URL',
  'https://events.{region}.confidence.dev/v1/events:publish',
);

const TELEMETRY_EVENT_DEFINITION = 'eventDefinitions/agent-telemetry';
const TELEMETRY_SOURCE = 'wizard';

type TelemetryRegion = 'EU' | 'US';

export type TelemetrySentiment = 'positive' | 'neutral' | 'confused' | 'frustrated';

export type TelemetryCompletion = 'starting' | 'in_progress' | 'completing' | 'done';

export type TelemetryEvent = {
  step: string;
  action: string;
  sentiment?: TelemetrySentiment;
  completion?: TelemetryCompletion;
};

export type TelemetryClient = {
  track: (event: TelemetryEvent) => void;
  updateRegion: (region: TelemetryRegion) => void;
};

function eventsUrl(region: TelemetryRegion): string {
  return TELEMETRY_EVENTS_URL_TEMPLATE.replace('{region}', region.toLowerCase());
}

function createTelemetryClient(opts: {
  sessionId: string;
  region?: TelemetryRegion;
}): TelemetryClient {
  let region = opts.region ?? 'EU';
  let clientSecret: string | null = null;
  let acquirePromise: Promise<void> | null = null;
  let failed = false;

  async function acquireKey(): Promise<void> {
    try {
      const res = await fetch(TELEMETRY_KEY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: opts.sessionId }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        failed = true;
        return;
      }
      const data = (await res.json()) as { clientSecret?: string; client_secret?: string };
      clientSecret = data.clientSecret ?? data.client_secret ?? null;
      if (!clientSecret) failed = true;
    } catch {
      failed = true;
    }
  }

  async function ensureKey(): Promise<void> {
    if (clientSecret) return;
    if (!acquirePromise) acquirePromise = acquireKey();
    await acquirePromise;
  }

  async function publish(event: TelemetryEvent): Promise<void> {
    const now = new Date().toISOString();
    try {
      await fetch(eventsUrl(region), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_secret: clientSecret,
          events: [
            {
              event_definition: TELEMETRY_EVENT_DEFINITION,
              payload: {
                session_id: opts.sessionId,
                skill: TELEMETRY_SOURCE,
                step: event.step,
                action: event.action,
                sentiment: event.sentiment ?? 'neutral',
                completion: event.completion ?? 'in_progress',
              },
              event_time: now,
            },
          ],
          send_time: now,
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // fire-and-forget
    }
  }

  async function doTrack(event: TelemetryEvent): Promise<void> {
    if (failed) return;
    await ensureKey();
    if (!clientSecret) return;
    await publish(event);
  }

  return {
    track(event: TelemetryEvent): void {
      doTrack(event).catch(() => {});
    },
    updateRegion(newRegion: TelemetryRegion): void {
      region = newRegion;
    },
  };
}

function createNoopClient(): TelemetryClient {
  return {
    track() {},
    updateRegion() {},
  };
}

export function isTelemetryEnabled(): boolean {
  const explicit = env('CONFIDENCE_TELEMETRY');
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;

  if (isCI()) return false;
  if (env('NODE_ENV') === 'test' || env('NODE_ENV') === 'development') return false;

  return true;
}

let client: TelemetryClient = createNoopClient();

export function initTelemetry(opts: { sessionId: string; region?: TelemetryRegion }): void {
  if (!isTelemetryEnabled()) return;
  client = createTelemetryClient(opts);
}

export function getTelemetry(): TelemetryClient {
  return client;
}

export function track(event: TelemetryEvent): void {
  client.track(event);
}

export function resetTelemetry(): void {
  client = createNoopClient();
}
