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

  http.get(`${EVENTS_EU_BASE}/v1/events`, () => {
    return HttpResponse.json({
      items: [
        {
          name: 'page-viewed',
          displayName: 'Page Viewed',
          fields: [{ name: 'url', type: 'STRING' }],
          createTime: '2026-01-01T00:00:00Z',
        },
        {
          name: 'button-clicked',
          displayName: 'Button Clicked',
          fields: [
            { name: 'label', type: 'STRING' },
            { name: 'position', type: 'NUMBER' },
          ],
          createTime: '2026-01-02T00:00:00Z',
        },
      ],
    });
  }),

  http.get(`${EVENTS_EU_BASE}/v1/events/:name`, (info) => {
    return HttpResponse.json({
      name: info.params['name'],
      displayName: 'Page Viewed',
      description: 'Tracks page views',
      fields: [{ name: 'url', type: 'STRING' }],
      createTime: '2026-01-01T00:00:00Z',
      updateTime: '2026-01-02T00:00:00Z',
    });
  }),

  http.post(`${EVENTS_EU_BASE}/v1/events`, async (info) => {
    const body = (await info.request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      name: 'new-event',
      displayName: body.displayName,
      description: body.description,
      fields: body.fields,
      createTime: '2026-10-05T00:00:00Z',
    });
  }),

  http.post(`${EVENTS_EU_BASE}/v1/events\\:validate`, () => {
    return HttpResponse.json({ valid: true });
  }),
];
