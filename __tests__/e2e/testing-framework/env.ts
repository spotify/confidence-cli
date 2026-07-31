export { AUTH_CALLBACK_PORT } from '@lib/auth.js';

/**
 * Baseline environment variables injected into every e2e terminal session.
 *
 * Forces a consistent terminal environment regardless of the host machine's
 * locale, CI mode, or color support settings.
 */
export const E2E_BASE_ENV: Record<string, string> = {
  CI: '0',
  TERM: 'xterm-256color',
  FORCE_COLOR: '1',
  NODE_ENV: 'test',
};

/**
 * Builds environment variables that point Confidence service URLs
 * at the mock HTTP server.
 *
 * @param baseUrl - The mock server's base URL (e.g. `http://127.0.0.1:12345`).
 * @returns A record of `CONFIDENCE_*` env vars ready to merge into the session env.
 */
export function buildMockEnv(baseUrl: string): Record<string, string> {
  return {
    CONFIDENCE_AUTH_URL: baseUrl,
    CONFIDENCE_MCP_URL: baseUrl,
    CONFIDENCE_SKILLS_URL: `${baseUrl}/skills`,
    CONFIDENCE_TELEMETRY_KEY_URL: `${baseUrl}/v1/agentTelemetryKey:acquire`,
    CONFIDENCE_TELEMETRY_EVENTS_URL: `${baseUrl}/v1/events:publish`,
  };
}
