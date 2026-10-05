import { http, HttpResponse } from 'msw';

export const telemetryHandlers = [
  http.post('https://onboarding.confidence.dev/v1/agentTelemetryKey:acquire', () => {
    return HttpResponse.json({ clientSecret: 'test-telemetry-key' });
  }),
];
