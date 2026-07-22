export { AUTH_CALLBACK_PORT } from '@lib/auth.js';

export const E2E_BASE_ENV: Record<string, string> = {
  CI: '0',
  TERM: 'xterm-256color',
  FORCE_COLOR: '1',
  NODE_ENV: 'test',
};

export function buildMockEnv(baseUrl: string): Record<string, string> {
  return {
    CONFIDENCE_AUTH_URL: baseUrl,
    CONFIDENCE_MCP_URL: baseUrl,
    CONFIDENCE_SKILLS_URL: `${baseUrl}/skills`,
    CONFIDENCE_TELEMETRY_KEY_URL: `${baseUrl}/v1/agentTelemetryKey:acquire`,
    CONFIDENCE_TELEMETRY_EVENTS_URL: `${baseUrl}/v1/events:publish`,
  };
}
