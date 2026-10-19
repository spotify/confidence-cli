import { http, HttpResponse } from 'msw';

const AUTH_URL = 'https://auth.confidence.dev/oauth/token';

export const authHandlers = [
  http.post(AUTH_URL, () => {
    return HttpResponse.json({
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
      expires_in: 86400,
    });
  }),
];

export function tokenResponse(accessToken: string) {
  return http.post(AUTH_URL, () =>
    HttpResponse.json({
      access_token: accessToken,
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
    }),
  );
}

export function tokenError(status = 401) {
  return http.post(AUTH_URL, () => HttpResponse.json({}, { status }));
}
