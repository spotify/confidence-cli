import {
  renderScreen,
  renderApp,
  createProjectDir,
  act,
  ENTER,
  ARROW_DOWN,
  waitFor,
} from '../testing-framework/index.js';
import { InstallPluginsScreen } from '@ui/screens/install-plugins/index.js';
import { ScreenId } from '@spotify-confidence/core';

vi.mock('@spotify-confidence/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@spotify-confidence/core')>()),
  detectInstalledPlugins: vi.fn().mockResolvedValue([]),
  prepareIde: vi.fn().mockResolvedValue(undefined),
  installPlugin: vi.fn().mockResolvedValue('download'),
  updatePlugin: vi.fn().mockResolvedValue('download'),
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
      expect(sut.lastFrame()).toContain('Claude Code');
      expect(sut.lastFrame()).toContain('Cursor');
      expect(sut.lastFrame()).toContain('Codex');
    });
  });

  it('shows file system access warning during IDE selection', async () => {
    using sut = renderScreen(<InstallPluginsScreen />, { screen: ScreenId.InstallPlugins });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('full file system access');
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
      expect(sut.lastFrame()).toContain('Plugin set up successfully');
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
    const { detectInstalledPlugins } = await import('@spotify-confidence/core');
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
    const { detectInstalledPlugins } = await import('@spotify-confidence/core');
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
    const { installPlugin } = await import('@spotify-confidence/core');
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
