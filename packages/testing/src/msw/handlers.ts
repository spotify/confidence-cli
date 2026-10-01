import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('https://mcp.confidence.dev/mcp/flags', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  http.post('https://mcp.confidence.dev/mcp/docs', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  http.post('https://auth.confidence.dev/oauth/token', () => {
    return HttpResponse.json({
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
      expires_in: 86400,
    });
  }),

  http.get(
    'https://raw.githubusercontent.com/spotify/confidence-ai-plugins/main/skills/:skill/SKILL.md',
    ({ params }) => {
      return HttpResponse.text(`# ${params['skill']}\nTest skill content`);
    },
  ),

  http.post('https://onboarding.confidence.dev/v1/agentTelemetryKey:acquire', () => {
    return HttpResponse.json({ clientSecret: 'test-telemetry-key' });
  }),

  http.post('https://events.eu.confidence.dev/v1/events:publish', () => {
    return HttpResponse.json({});
  }),

  http.post('https://events.us.confidence.dev/v1/events:publish', () => {
    return HttpResponse.json({});
  }),
];
