import { createServer, type Server } from 'node:http';
import { buildTestJwt } from './jwt.js';

export type MockServer = {
  port: number;
  url: string;
  server: Server;
  envVars: Record<string, string>;
  [Symbol.dispose](): void;
};

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
        envVars: {
          CONFIDENCE_AUTH_URL: url,
          CONFIDENCE_MCP_URL: url,
          CONFIDENCE_SKILLS_URL: `${url}/skills`,
          CONFIDENCE_TELEMETRY_KEY_URL: `${url}/v1/agentTelemetryKey:acquire`,
          CONFIDENCE_TELEMETRY_EVENTS_URL: `${url}/v1/events:publish`,
        },
        [Symbol.dispose]() {
          server.close();
        },
      });
    });

    server.on('error', reject);
  });
}
