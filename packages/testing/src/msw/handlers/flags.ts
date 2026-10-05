import { http, HttpResponse } from 'msw';

export const FLAGS_EU_BASE = 'https://flags.eu.confidence.dev';
export const FLAGS_US_BASE = 'https://flags.us.confidence.dev';

export const flagsHandlers = [
  http.get(`${FLAGS_EU_BASE}/v1/flags`, () => {
    return HttpResponse.json({ flags: [] });
  }),

  http.get(`${FLAGS_EU_BASE}/v1/flags/:flagId`, () => {
    return HttpResponse.json({ name: 'flags/unknown', flagId: 'unknown' });
  }),

  http.patch(`${FLAGS_EU_BASE}/v1/flags/:flagId`, () => {
    return HttpResponse.json({ name: 'flags/unknown', flagId: 'unknown' });
  }),

  http.post(`${FLAGS_EU_BASE}/v1/flags/:flagId\\:archive`, () => {
    return HttpResponse.json({ name: 'flags/unknown', archived: true });
  }),

  http.get(`${FLAGS_US_BASE}/v1/flags`, () => {
    return HttpResponse.json({ flags: [] });
  }),

  http.get(`${FLAGS_US_BASE}/v1/flags/:flagId`, () => {
    return HttpResponse.json({ name: 'flags/unknown', flagId: 'unknown' });
  }),

  http.patch(`${FLAGS_US_BASE}/v1/flags/:flagId`, () => {
    return HttpResponse.json({ name: 'flags/unknown', flagId: 'unknown' });
  }),

  http.post(`${FLAGS_US_BASE}/v1/flags/:flagId\\:archive`, () => {
    return HttpResponse.json({ name: 'flags/unknown', archived: true });
  }),
];
