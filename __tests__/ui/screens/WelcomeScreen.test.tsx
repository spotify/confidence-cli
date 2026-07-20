import {
  renderScreen,
  renderApp,
  createProjectDir,
  ARROW_DOWN,
  ENTER,
  waitFor,
} from '../helpers/index.js';
import { WelcomeScreen } from '@ui/tui/screens/welcome/index.js';

vi.mock('../../../src/lib/system-check.js', () => ({
  runAllChecks: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../src/integrations/plugins.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/integrations/plugins.js')>();
  return {
    ...actual,
    detectInstalledPlugins: vi.fn().mockReturnValue([]),
  };
});

describe('WelcomeScreen', () => {
  it('displays title and project directory', async () => {
    using project = createProjectDir();
    using sut = renderScreen(<WelcomeScreen />, { dir: project.path });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Confidence Quickstart');
      expect(sut.lastFrame()).toContain('Directory');
    });
  });

  it('detects and shows the project framework', async () => {
    using project = createProjectDir();
    using sut = renderScreen(<WelcomeScreen />, { dir: project.path });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('React');
    });
  });

  it('lists wizard steps', async () => {
    using project = createProjectDir();
    using sut = renderScreen(<WelcomeScreen />, { dir: project.path });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Check your system');
      expect(sut.lastFrame()).toContain('Sign in to Confidence');
    });
  });

  it('shows prompt options', async () => {
    using project = createProjectDir();
    using sut = renderScreen(<WelcomeScreen />, { dir: project.path });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Start setup');
      expect(sut.lastFrame()).toContain('About Confidence');
    });
  });

  it('navigates to SystemCheck on "Start setup"', async () => {
    using project = createProjectDir();
    using sut = renderApp({ dir: project.path });

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Start setup');
    });

    sut.stdin.write(ENTER);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('System Check');
    });
  });

  it('navigates to SelectFramework on "Change framework"', async () => {
    using project = createProjectDir();
    using sut = renderApp({ dir: project.path });

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Change framework');
    });

    sut.stdin.write(ARROW_DOWN + ENTER);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Select Framework');
    });
  });

  it('navigates to About on "About Confidence"', async () => {
    using project = createProjectDir();
    using sut = renderApp({ dir: project.path });

    sut.stdin.write(ARROW_DOWN + ARROW_DOWN + ENTER);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('About Confidence');
    });
  });

  describe('when no known framework is detected', () => {
    it('hides "Start setup" and shows "Select framework"', async () => {
      using project = createProjectDir(null);
      using sut = renderScreen(<WelcomeScreen />, { dir: project.path });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Could not auto-detect');
        expect(sut.lastFrame()).not.toContain('Start setup');
        expect(sut.lastFrame()).toContain('Select framework');
      });
    });

    it('does not show "Change framework"', async () => {
      using project = createProjectDir(null);
      using sut = renderScreen(<WelcomeScreen />, { dir: project.path });

      await waitFor(() => {
        expect(sut.lastFrame()).not.toContain('Change framework');
      });
    });

    it('navigates to SelectFramework on "Select framework"', async () => {
      using project = createProjectDir(null);
      using sut = renderApp({ dir: project.path });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Select framework');
      });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Select Framework');
      });
    });
  });
});
