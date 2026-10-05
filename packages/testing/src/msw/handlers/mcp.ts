import { http, HttpResponse } from 'msw';

export const mcpHandlers = [
  http.post('https://mcp.confidence.dev/mcp/flags', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  http.post('https://mcp.confidence.dev/mcp/docs', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];
