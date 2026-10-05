import { http, HttpResponse } from 'msw';

export const EVENTS_EU_BASE = 'https://events.eu.confidence.dev';
export const EVENTS_US_BASE = 'https://events.us.confidence.dev';

export const eventsHandlers = [
  http.post(`${EVENTS_EU_BASE}/v1/events\\:publish`, () => {
    return HttpResponse.json({});
  }),

  http.post(`${EVENTS_US_BASE}/v1/events\\:publish`, () => {
    return HttpResponse.json({});
  }),
];
