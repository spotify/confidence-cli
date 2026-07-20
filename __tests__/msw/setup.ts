import { server } from './server.js';

// Future-proofing:
// currently no hosts are allowed to be hit
// but we may need some later.
const ALLOWED_HOSTS: string[] = [];

beforeAll(() =>
  server.listen({
    onUnhandledRequest(request, print) {
      const url = new URL(request.url);
      if (ALLOWED_HOSTS.includes(url.hostname)) return;
      print.warning();
    },
  }),
);

afterEach(() => server.resetHandlers());
afterAll(() => server.close());
