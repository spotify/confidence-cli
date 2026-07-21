import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { http, HttpResponse } from 'msw';
import {
  act,
  renderScreen,
  createProjectDir,
  waitFor,
  buildExpiredJwt,
  buildAuthState,
  ENTER,
} from '../helpers/index.js';
import { ConnectToolsScreen } from '@ui/tui/screens/connect-tools/index.js';
import { ScreenId } from '@lib/session.js';
import { persistMcpPreference, clearMcpPreference, MCP_SERVERS } from '@integrations/index.js';
import type { McpServerName } from '@integrations/index.js';
import type { ChosenIde } from '@lib/session.js';
import { server } from '../../msw/server.js';

type IntegrationTestCase = {
  ide: ChosenIde;
};

describe('ConnectToolsScreen', () => {
  describe('when MCP auth is stale', () => {
    it('shows ask-install prompt instead of auto-reconnecting', async () => {
      // Arrange
      server.use(
        http.post('https://mcp.confidence.dev/mcp/flags', () => HttpResponse.error()),
        http.post('https://mcp.confidence.dev/mcp/docs', () => HttpResponse.error()),
      );

      using _pref = createMcpPreference('connected');
      using project = createProjectDir();
      writeMcpConfig(project.path, 'cursor');

      // Act
      using sut = renderScreen(<ConnectToolsScreen />, {
        screen: ScreenId.ConnectTools,
        dir: project.path,
        ide: 'cursor',
        authState: buildAuthState(buildExpiredJwt()),
      });

      // Assert
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Connect all tools');
      });
    }, 10000);
  });

  describe('when config has expired auth tokens', () => {
    it.each<IntegrationTestCase>([{ ide: 'claude' }, { ide: 'cursor' }])(
      'shows auth-expired status for $ide',
      async ({ ide }) => {
        // Arrange
        using project = createProjectDir();
        writeMcpConfig(project.path, ide, { token: buildExpiredJwt() });

        // Act
        using sut = renderScreen(<ConnectToolsScreen />, {
          screen: ScreenId.ConnectTools,
          dir: project.path,
          ide,
        });

        // Assert
        await waitFor(() => {
          expect(sut.lastFrame()).toContain('auth expired');
          expect(sut.lastFrame()).toContain('Reconnect');
        });
      },
      10000,
    );

    it('shows expired auth warning message', async () => {
      using project = createProjectDir();
      writeMcpConfig(project.path, 'cursor', { token: buildExpiredJwt() });

      using sut = renderScreen(<ConnectToolsScreen />, {
        screen: ScreenId.ConnectTools,
        dir: project.path,
        ide: 'cursor',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Authentication expired');
        expect(sut.lastFrame()).toContain('Reconnect to refresh credentials?');
      });
    }, 10000);

    it('reconnects successfully when user selects reconnect', async () => {
      // Arrange
      using project = createProjectDir();
      writeMcpConfig(project.path, 'cursor', { token: buildExpiredJwt() });

      using sut = renderScreen(<ConnectToolsScreen />, {
        screen: ScreenId.ConnectTools,
        dir: project.path,
        ide: 'cursor',
        authState: buildAuthState(),
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Reconnect all tools');
      });

      // Act
      await act(() => sut.stdin.write(ENTER));

      // Assert
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Connected successfully');
      });
    }, 10000);
  });

  describe('when server returns 401 during detection', () => {
    // Arrange
    it('shows auth-expired for codex', async () => {
      server.use(
        http.post(
          'https://mcp.confidence.dev/mcp/flags',
          () => new HttpResponse(null, { status: 401 }),
        ),
        http.post(
          'https://mcp.confidence.dev/mcp/docs',
          () => new HttpResponse(null, { status: 401 }),
        ),
      );

      using project = createProjectDir();
      writeMcpConfig(project.path, 'codex');

      // Act
      using sut = renderScreen(<ConnectToolsScreen />, {
        screen: ScreenId.ConnectTools,
        dir: project.path,
        ide: 'codex',
      });

      // Assert
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('auth expired');
        expect(sut.lastFrame()).toContain('Reconnect');
      });
    }, 10000);
  });

  describe('when server returns 401 after connecting', () => {
    it.each<IntegrationTestCase>([{ ide: 'claude' }, { ide: 'cursor' }])(
      'shows auth-expired for $ide',
      async ({ ide }) => {
        // Arrange
        server.use(
          http.post(
            'https://mcp.confidence.dev/mcp/flags',
            () => new HttpResponse(null, { status: 401 }),
          ),
          http.post(
            'https://mcp.confidence.dev/mcp/docs',
            () => new HttpResponse(null, { status: 401 }),
          ),
        );

        using project = createProjectDir();

        using sut = renderScreen(<ConnectToolsScreen />, {
          screen: ScreenId.ConnectTools,
          dir: project.path,
          ide,
        });

        await waitFor(() => {
          expect(sut.lastFrame()).toContain('Connect all tools');
        });

        // Act
        await act(() => sut.stdin.write(ENTER));

        // Assert
        await waitFor(() => {
          expect(sut.lastFrame()).toContain('auth expired');
        });
      },
      10000,
    );
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

type McpConfigOpts = {
  token?: string;
};

function writeMcpConfig(projectDir: string, ide: ChosenIde, opts?: McpConfigOpts): void {
  switch (ide) {
    case 'claude':
      return writeJsonMcpConfig(join(projectDir, '.mcp.json'), opts);

    case 'cursor':
      mkdirSync(join(projectDir, '.cursor'), { recursive: true });
      return writeJsonMcpConfig(join(projectDir, '.cursor', 'mcp.json'), opts);

    case 'codex':
      return writeCodexMcpConfig(projectDir);

    default: {
      const _exhaustive: never = ide satisfies never;
      throw new Error(`Unhandled IDE: ${_exhaustive}`);
    }
  }
}

function writeJsonMcpConfig(configPath: string, opts?: McpConfigOpts): void {
  writeFileSync(
    configPath,
    JSON.stringify({
      mcpServers: Object.fromEntries(
        Object.entries(MCP_SERVERS).map(([name, { type, url }]) => {
          const server: Record<string, unknown> = { type, url };

          if (opts?.token) {
            server.headers = { Authorization: `Bearer ${opts.token}` };
          }

          return [name, server];
        }),
      ),
    }),
  );
}

function writeCodexMcpConfig(projectDir: string): void {
  const content = (Object.keys(MCP_SERVERS) as McpServerName[])
    .map((name) => `[mcp_servers.${name}]\nurl = "${MCP_SERVERS[name].url}"`)
    .join('\n\n');

  mkdirSync(join(projectDir, '.codex'), { recursive: true });
  writeFileSync(join(projectDir, '.codex', 'config.toml'), content);
}
