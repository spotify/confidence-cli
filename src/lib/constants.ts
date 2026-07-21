export const CONFIDENCE_SITE_URL = 'https://confidence.spotify.com/';
export const CONFIDENCE_DOCS_URL = 'https://confidence.spotify.com/docs';
export const CONFIDENCE_DASHBOARD_URL = 'https://app.confidence.spotify.com';

export const AUTH0_DOMAIN = process.env.CONFIDENCE_AUTH_DOMAIN ?? 'auth.confidence.dev';
export const AUTH0_BASE_URL = process.env.CONFIDENCE_AUTH_URL ?? `https://${AUTH0_DOMAIN}`;
export const AUTH0_AUDIENCE = 'https://confidence.dev/';
export const AUTH0_SCOPE = 'openid profile email offline_access';
export const AUTH0_CLIENT_ID_SIGNUP = '82qMvwZvqd3t3S0gRDvs8R53TehQXSJY';
export const AUTH0_CLIENT_ID_LOGIN = '2fG3H4RhlAbIZm9Rfn32zTaILH7w1X4w';
export const AUTH_CALLBACK_PORT = 8084;

export const PLUGINS_REPO_URL = 'https://github.com/spotify/confidence-ai-plugins/';
export const SKILLS_BASE_URL =
  process.env.CONFIDENCE_SKILLS_URL ??
  'https://raw.githubusercontent.com/spotify/confidence-ai-plugins/main/skills';

export const TELEMETRY_KEY_URL =
  process.env.CONFIDENCE_TELEMETRY_KEY_URL ??
  'https://onboarding.confidence.dev/v1/agentTelemetryKey:acquire';
export const TELEMETRY_EVENTS_URL_TEMPLATE =
  process.env.CONFIDENCE_TELEMETRY_EVENTS_URL ??
  'https://events.{region}.confidence.dev/v1/events:publish';
export const TELEMETRY_EVENT_DEFINITION = 'eventDefinitions/agent-telemetry';
export const TELEMETRY_SOURCE = 'wizard';
