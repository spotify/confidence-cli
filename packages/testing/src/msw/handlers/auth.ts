import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.post('https://auth.confidence.dev/oauth/token', () => {
    return HttpResponse.json({
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
      expires_in: 86400,
    });
  }),
];
