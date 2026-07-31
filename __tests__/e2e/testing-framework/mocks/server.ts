import { createServer, type Server } from 'node:http';
import { buildTestJwt } from '../../../shared/auth.js';
import { buildMockEnv } from '../env.js';

/**
 * A running mock HTTP server that stubs every Confidence backend
 * endpoint the wizard calls during e2e tests.
 *
 * Supports `Symbol.dispose` for use with `using` in global setup.
 */
export type MockServer = {
  /** The port the server is listening on. */
  port: number;
  /** Full base URL including port (e.g. `http://127.0.0.1:12345`). */
  url: string;
  /** The underlying Node.js HTTP server instance. */
  server: Server;
  /** Environment variables pointing `CONFIDENCE_*` URLs at this server. */
  envVars: Record<string, string>;
  /** Shuts down the server. */
  [Symbol.dispose](): void;
};

/**
 * Starts a mock HTTP server on a random available port that stubs
 * the Confidence backend endpoints used during e2e tests.
 *
 * Endpoints handled:
 * - `POST /oauth/token` — returns a test JWT + refresh token
 * - `POST /mcp/flags`, `POST /mcp/docs` — returns `{ status: 'ok' }`
 * - `GET /skills/:skill/SKILL.md` — returns placeholder skill content
 * - `POST .../agentTelemetryKey` — returns a test telemetry key
 * - `POST .../events:publish` — accepts and discards telemetry events
 *
 * @returns A promise that resolves with a disposable {@link MockServer}.
 *
 * @example
 * ```ts
 * // In global-setup.ts
 * const server = await startMockServer();
 * Object.assign(process.env, server.envVars);
 * // teardown:
 * server[Symbol.dispose]();
 * ```
 */
export function startMockServer(): Promise<MockServer> {
  return new Promise((resolve, reject) => {
    const testJwt = buildTestJwt();

    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost`);
      const chunks: Buffer[] = [];

      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      req.on('end', () => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'POST' && url.pathname === '/oauth/token') {
          res.end(
            JSON.stringify({
              access_token: testJwt,
              refresh_token: 'test-refresh-token',
              token_type: 'Bearer',
              expires_in: 86400,
            }),
          );
          return;
        }

        if (req.method === 'POST' && url.pathname === '/mcp/flags') {
          res.end(JSON.stringify({ status: 'ok' }));
          return;
        }

        if (req.method === 'POST' && url.pathname === '/mcp/docs') {
          res.end(JSON.stringify({ status: 'ok' }));
          return;
        }

        if (req.method === 'GET' && url.pathname.startsWith('/skills/')) {
          const skill = url.pathname.replace('/skills/', '').replace('/SKILL.md', '');
          res.setHeader('Content-Type', 'text/plain');
          res.end(`# ${skill}\nTest skill content`);
          return;
        }

        if (req.method === 'POST' && url.pathname.includes('agentTelemetryKey')) {
          res.end(JSON.stringify({ clientSecret: 'test-telemetry-key' }));
          return;
        }

        if (req.method === 'POST' && url.pathname.includes('events:publish')) {
          res.end(JSON.stringify({}));
          return;
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'not found' }));
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to get server address'));
        return;
      }

      const port = addr.port;
      const url = `http://127.0.0.1:${port}`;

      resolve({
        port,
        url,
        server,
        envVars: buildMockEnv(url),
        [Symbol.dispose]() {
          server.close();
        },
      });
    });

    server.on('error', reject);
  });
}
