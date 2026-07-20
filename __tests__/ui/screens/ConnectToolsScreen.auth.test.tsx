import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { http, HttpResponse } from 'msw';
import { renderScreen, createProjectDir, waitFor } from '../helpers/index.js';
import { ConnectToolsScreen } from '@ui/tui/screens/connect-tools/index.js';
import { ScreenId } from '@lib/session.js';
import { store } from '@ui/tui/store.js';
import { persistMcpPreference, clearMcpPreference, MCP_SERVERS } from '@integrations/index.js';
import { server } from '../../msw/server.js';

describe('ConnectToolsScreen', () => {
  describe('when MCP auth is stale', () => {
    it('shows ask-install prompt instead of auto-reconnecting', async () => {
      using _pref = createMcpPreference('connected');

      server.use(
        http.post('https://mcp.confidence.dev/mcp/flags', () => HttpResponse.error()),
        http.post('https://mcp.confidence.dev/mcp/docs', () => HttpResponse.error()),
      );

      using project = createProjectDir();
      writeCursorMcpConfig(project.path);

      using sut = renderScreen(<ConnectToolsScreen />, {
        screen: ScreenId.ConnectTools,
        dir: project.path,
        ide: 'cursor',
      });

      store.setAuthState({
        status: 'authenticated',
        token: createStaleJwt(),
        region: 'EU',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Connect all tools');
      });
    }, 10000);
  });
});

function createMcpPreference(value: 'connected' | 'skipped') {
  persistMcpPreference(value);
  return {
    [Symbol.dispose]() {
      clearMcpPreference();
    },
  };
}

function writeCursorMcpConfig(projectDir: string): void {
  const entries = Object.fromEntries(
    Object.entries(MCP_SERVERS).map(([name, cfg]) => [name, { type: cfg.type, url: cfg.url }]),
  );
  mkdirSync(join(projectDir, '.cursor'), { recursive: true });
  writeFileSync(join(projectDir, '.cursor', 'mcp.json'), JSON.stringify({ mcpServers: entries }));
}

function createStaleJwt(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) - 3600,
      'https://confidence.dev/region': 'EU',
    }),
  ).toString('base64url');
  return `${header}.${payload}.fake-signature`;
}
