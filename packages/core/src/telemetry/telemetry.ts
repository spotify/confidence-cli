import { randomUUID } from 'node:crypto';
import { env, isCI } from '../system/env.js';

const TELEMETRY_KEY_URL = env(
  'CONFIDENCE_TELEMETRY_KEY_URL',
  'https://onboarding.confidence.dev/v1/agentTelemetryKey:acquire',
);

const TELEMETRY_EVENTS_URL_TEMPLATE = env(
  'CONFIDENCE_TELEMETRY_EVENTS_URL',
  'https://events.{region}.confidence.dev/v1/events:publish',
);

const TELEMETRY_EVENT_DEFINITION = 'eventDefinitions/agent-telemetry';
const TELEMETRY_TIMEOUT_MS = 3000;

type TelemetryRegion = 'EU' | 'US';
type TelemetryKeyResponse = {
  clientSecret?: string;
  client_secret?: string;
};

export type TelemetrySentiment = 'positive' | 'neutral' | 'confused' | 'frustrated';
export type TelemetryCompletion = 'starting' | 'in_progress' | 'completing' | 'done';

export type TelemetryEvent = {
  step: string;
  action: string;
  sentiment?: TelemetrySentiment;
  completion?: TelemetryCompletion;
};

export type TelemetryOptions = {
  source: string;
  sessionId?: string;
  region?: TelemetryRegion;
};

export type TelemetryClient = {
  updateRegion: (region: TelemetryRegion) => void;
  track: (event: TelemetryEvent) => void;
  flush: () => Promise<void>;
};

function eventsUrl(region: TelemetryRegion): string {
  return TELEMETRY_EVENTS_URL_TEMPLATE.replace('{region}', region.toLowerCase());
}

function createTelemetryClient(opts: TelemetryOptions): TelemetryClient {
  const sessionId = opts.sessionId ?? randomUUID();
  const pending = new Set<Promise<void>>();
  const source = opts.source;

  let region = opts.region ?? 'EU';
  let secret: string | null = null;
  let acquire: Promise<void> | null = null;
  let failed = false;

  async function acquireKey(): Promise<void> {
    try {
      const res = await fetch(TELEMETRY_KEY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
        signal: AbortSignal.timeout(TELEMETRY_TIMEOUT_MS),
      });

      if (!res.ok) {
        failed = true;
        return;
      }

      const data = (await res.json()) as TelemetryKeyResponse;
      secret = data.clientSecret ?? data.client_secret ?? null;

      if (!secret) {
        failed = true;
      }
    } catch {
      failed = true;
    }
  }

  async function ensureKey(): Promise<boolean> {
    if (secret) return true;
    await (acquire ??= acquireKey());
    return !!secret;
  }

  async function publish(event: TelemetryEvent): Promise<void> {
    const now = new Date().toISOString();
    try {
      await fetch(eventsUrl(region), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_secret: secret,
          events: [
            {
              event_definition: TELEMETRY_EVENT_DEFINITION,
              payload: {
                session_id: sessionId,
                skill: source,
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
        signal: AbortSignal.timeout(TELEMETRY_TIMEOUT_MS),
      });
    } catch {
      // fire-and-forget
    }
  }

  async function doTrack(event: TelemetryEvent): Promise<void> {
    try {
      if (failed) return;
      if (!(await ensureKey())) return;
      await publish(event);
    } catch {
      // Don't surface telemetry errors.
    }
  }

  void ensureKey();

  return {
    updateRegion(updated: TelemetryRegion): void {
      region = updated;
    },
    track(event: TelemetryEvent): void {
      const p = doTrack(event).finally(() => pending.delete(p));
      pending.add(p);
    },
    async flush(): Promise<void> {
      const timeout = new Promise((r) => setTimeout(r, TELEMETRY_TIMEOUT_MS).unref());
      await Promise.race([Promise.allSettled([...pending]), timeout]);
    },
  };
}

function createNoopClient(): TelemetryClient {
  return {
    track() {},
    async flush() {},
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

export function initTelemetry(opts: TelemetryOptions): void {
  if (!isTelemetryEnabled()) return;
  client = createTelemetryClient(opts);
}

export function getTelemetry(): TelemetryClient {
  return client;
}

export function track(event: TelemetryEvent): void {
  client.track(event);
}

export async function flush(): Promise<void> {
  await client.flush();
}

export function resetTelemetry(): void {
  client = createNoopClient();
}
