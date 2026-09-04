import {
  renderScreen,
  renderApp,
  createProjectDir,
  act,
  ENTER,
  ARROW_DOWN,
  waitFor,
} from '../testing-framework/index.js';
import { InstallPluginsScreen } from '@ui/tui/screens/install-plugins/index.js';
import { ScreenId } from '@lib/session.js';

vi.mock('../../../src/integrations/skills/plugin.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/integrations/skills/plugin.js')>()),
  detectInstalledPlugins: vi.fn().mockResolvedValue([]),
  prepareIde: vi.fn().mockResolvedValue(undefined),
  installPlugin: vi.fn().mockResolvedValue('download'),
}));

describe('InstallPluginsScreen', () => {
  it('renders title', async () => {
    using sut = renderScreen(<InstallPluginsScreen />, { screen: ScreenId.InstallPlugins });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Select agent to set up');
    });
  });

  it('shows IDE selection when no plugins detected', async () => {
    using sut = renderScreen(<InstallPluginsScreen />, { screen: ScreenId.InstallPlugins });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Claude Code (Recommended)');
      expect(sut.lastFrame()).toContain('Cursor');
      expect(sut.lastFrame()).toContain('Codex');
    });
  });

  it('shows Claude Code recommendation note during IDE selection', async () => {
    using sut = renderScreen(<InstallPluginsScreen />, { screen: ScreenId.InstallPlugins });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('safer and more controlled');
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

    await act(() => sut.stdin.write(ARROW_DOWN + ENTER));

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

    await act(() => sut.stdin.write(ARROW_DOWN + ENTER));

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Teach your AI Confidence');
    });
  });

  it('shows continue option when plugins already installed', async () => {
    const { detectInstalledPlugins } = await import('../../../src/integrations/skills/plugin.js');
    vi.mocked(detectInstalledPlugins).mockResolvedValueOnce([{ ide: 'claude', via: 'cli' }]);

    using sut = renderApp({ screen: ScreenId.InstallPlugins });

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Confidence plugin detected for Claude Code');
      expect(sut.lastFrame()).toContain('Continue with Claude Code');
    });

    await act(() => sut.stdin.write(ENTER));

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Teach your AI Confidence');
    });
  });

  it('sorts detected IDEs above non-detected ones', async () => {
    const { detectInstalledPlugins } = await import('../../../src/integrations/skills/plugin.js');
    vi.mocked(detectInstalledPlugins).mockResolvedValueOnce([
      { ide: 'claude', via: 'cli' },
      { ide: 'codex', via: 'cli' },
    ]);

    using sut = renderScreen(<InstallPluginsScreen />, { screen: ScreenId.InstallPlugins });

    await waitFor(() => {
      const frame = sut.lastFrame()!;
      const codexPos = frame.lastIndexOf('Codex');
      const cursorPos = frame.lastIndexOf('Cursor');
      expect(codexPos).toBeGreaterThan(-1);
      expect(cursorPos).toBeGreaterThan(-1);
      expect(codexPos).toBeLessThan(cursorPos);
    });
  });

  it('shows error and retry option on install failure', async () => {
    const { installPlugin } = await import('../../../src/integrations/skills/plugin.js');
    vi.mocked(installPlugin).mockRejectedValueOnce(new Error('Installation failed'));

    using project = createProjectDir();
    using sut = renderScreen(<InstallPluginsScreen />, {
      screen: ScreenId.InstallPlugins,
      dir: project.path,
    });

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Claude Code');
    });

    await act(() => sut.stdin.write(ARROW_DOWN + ENTER));

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Failed to install');
      expect(sut.lastFrame()).toContain('Retry');
    });
  });
});
