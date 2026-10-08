import { http, HttpResponse } from 'msw';
import {
  act,
  renderScreen,
  createProjectDir,
  prepareAuthTokens,
  waitFor,
  buildExpiredJwt,
  buildAuthState,
  ENTER,
} from '../testing-framework/index.js';
import { ConnectToolsScreen } from '@ui/screens/connect-tools/index.js';
import { ScreenId, persistMcpPreference, clearMcpPreference } from '@spotify-confidence/core';
import type { IdeId } from '@spotify-confidence/shared-kernel';
import { server } from '@spotify-confidence/testing';
import {
  writeClaudeGlobalConfig,
  writeCursorMcpConfig,
  writeCodexConfig,
} from '@spotify-confidence/testing/scaffold';

vi.mock('../../../../core/src/exec/exec.js', () => ({
  execFile: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
  spawn: vi.fn(),
}));

type IntegrationTestCase = {
  ide: IdeId;
};

describe('ConnectToolsScreen', () => {
  describe('when MCP auth is stale', () => {
    it('shows ask-install prompt instead of auto-reconnecting', async () => {
      // Arrange
      server.use(
        http.post('https://mcp.confidence.dev/mcp/flags', () => HttpResponse.error()),
        http.post('https://mcp.confidence.dev/mcp/docs', () => HttpResponse.error()),
      );

      using _auth = prepareAuthTokens('none');
      using _pref = createMcpPreference('connected');
      using project = createProjectDir();

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
        const token = buildExpiredJwt();
        using project = createProjectDir();
        using _mcp = seedMcpRegistration(project.path, { token });
        using _creds = prepareAuthTokens('expired');

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
      using _mcp = seedMcpRegistration(project.path, { token: buildExpiredJwt() });
      using _creds = prepareAuthTokens('expired');

      using sut = renderScreen(<ConnectToolsScreen />, {
        screen: ScreenId.ConnectTools,
        dir: project.path,
        ide: 'cursor',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain(
          'tools are already installed but authentication has expired',
        );
        expect(sut.lastFrame()).toContain('Reconnect to refresh credentials?');
      });
    }, 10000);

    it('reconnects successfully when user selects reconnect', async () => {
      // Arrange
      using project = createProjectDir();
      using _mcp = seedMcpRegistration(project.path, { token: buildExpiredJwt() });
      using _creds = prepareAuthTokens('expired');

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
    it('shows auth-expired for codex', async () => {
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
      using _mcp = seedMcpRegistration(project.path);
      using _auth = prepareAuthTokens();

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
    it('shows auth-expired after connect attempt', async () => {
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

      using _auth = prepareAuthTokens('none');
      using project = createProjectDir();

      using sut = renderScreen(<ConnectToolsScreen />, {
        screen: ScreenId.ConnectTools,
        dir: project.path,
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
    }, 10000);
  });
});

type SeedMcpOpts = {
  token?: string;
};

function seedMcpRegistration(projectDir: string, opts?: SeedMcpOpts) {
  vi.stubEnv('HOME', projectDir);

  const headers = opts?.token ? { Authorization: `Bearer ${opts.token}` } : undefined;
  const servers = {
    'confidence-flags': { type: 'http', url: 'https://mcp.confidence.dev/mcp/flags', headers },
    'confidence-docs': { type: 'http', url: 'https://mcp.confidence.dev/mcp/docs', headers },
  };
  const codexHeaders = opts?.token
    ? `\nhttp_headers = { "Authorization" = "Bearer ${opts.token}" }`
    : '';

  writeClaudeGlobalConfig(projectDir, projectDir, servers);
  writeCursorMcpConfig(projectDir, { mcpServers: servers });
  writeCodexConfig(
    projectDir,
    `[mcp_servers.confidence-flags]\nurl = "https://mcp.confidence.dev/mcp/flags"${codexHeaders}\n\n[mcp_servers.confidence-docs]\nurl = "https://mcp.confidence.dev/mcp/docs"${codexHeaders}\n`,
  );

  return {
    [Symbol.dispose]() {
      vi.unstubAllEnvs();
    },
  };
}

function createMcpPreference(value: 'connected' | 'skipped') {
  persistMcpPreference(value);

  return {
    [Symbol.dispose]() {
      clearMcpPreference();
    },
  };
}
