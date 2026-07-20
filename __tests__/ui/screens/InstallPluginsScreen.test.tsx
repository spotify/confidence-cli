import { http, HttpResponse } from 'msw';
import {
  renderScreen,
  renderApp,
  createProjectDir,
  ENTER,
  ARROW_DOWN,
  waitFor,
} from '../helpers/index.js';
import { InstallPluginsScreen } from '@ui/tui/screens/install-plugins/index.js';
import { ScreenId } from '@lib/session.js';
import { server } from '../../msw/server.js';

vi.mock('../../../src/integrations/plugins.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/integrations/plugins.js')>();
  return {
    ...actual,
    detectInstalledPlugins: vi.fn().mockReturnValue([]),
    prepareIde: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../../../src/lib/auth.js', () => ({
  loadPersistedToken: vi.fn().mockReturnValue(null),
  validateToken: vi.fn().mockReturnValue({ valid: false }),
  authenticate: vi.fn().mockResolvedValue({
    accessToken: 'test-token',
    refreshToken: 'test-refresh',
    region: 'EU' as const,
    workspace: 'test@example.com',
  }),
}));

describe('InstallPluginsScreen', () => {
  it('renders title', async () => {
    using sut = renderScreen(<InstallPluginsScreen />, { screen: ScreenId.InstallPlugins });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Teach your AI about Confidence');
    });
  });

  it('shows IDE selection when no plugins detected', async () => {
    using sut = renderScreen(<InstallPluginsScreen />, { screen: ScreenId.InstallPlugins });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Claude Code');
      expect(sut.lastFrame()).toContain('Cursor');
      expect(sut.lastFrame()).toContain('Codex');
      expect(sut.lastFrame()).toContain('Skip');
    });
  });

  it('advances to Authenticate on Skip', async () => {
    using sut = renderApp({ screen: ScreenId.InstallPlugins });

    sut.stdin.write(ARROW_DOWN + ARROW_DOWN + ARROW_DOWN + ENTER);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Sign in to Confidence');
    });
  });

  it('installs plugin and shows success', async () => {
    using project = createProjectDir();
    using sut = renderScreen(<InstallPluginsScreen />, {
      screen: ScreenId.InstallPlugins,
      dir: project.path,
    });

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Claude Code');
    });

    sut.stdin.write(ARROW_DOWN + ENTER);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Plugin installed successfully');
    });
  });

  it('auto-advances after install', async () => {
    using project = createProjectDir();
    using sut = renderApp({ screen: ScreenId.InstallPlugins, dir: project.path });

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Claude Code');
    });

    sut.stdin.write(ARROW_DOWN + ENTER);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Sign in to Confidence');
    });
  });

  it('shows continue option when plugins already installed', async () => {
    const { detectInstalledPlugins } = await import('../../../src/integrations/plugins.js');
    vi.mocked(detectInstalledPlugins).mockReturnValueOnce(['claude']);

    using sut = renderApp({ screen: ScreenId.InstallPlugins });

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Confidence plugin detected for Claude Code');
      expect(sut.lastFrame()).toContain('Continue with Claude Code');
    });

    sut.stdin.write(ENTER);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Sign in to Confidence');
    });
  });

  it('shows error and retry option on install failure', async () => {
    server.use(
      http.get(
        'https://raw.githubusercontent.com/spotify/confidence-ai-plugins/main/skills/:skill/SKILL.md',
        () => HttpResponse.error(),
      ),
    );

    using project = createProjectDir();
    using sut = renderScreen(<InstallPluginsScreen />, {
      screen: ScreenId.InstallPlugins,
      dir: project.path,
    });

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Claude Code');
    });

    sut.stdin.write(ARROW_DOWN + ENTER);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Failed to install');
      expect(sut.lastFrame()).toContain('Retry');
    });
  });
});
