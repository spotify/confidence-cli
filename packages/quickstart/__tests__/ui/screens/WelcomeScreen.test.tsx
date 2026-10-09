import {
  renderScreen,
  renderApp,
  createProjectDir,
  ARROW_DOWN,
  ENTER,
  waitFor,
  act,
} from '../testing-framework/index.js';
import { WelcomeScreen } from '@ui/screens/welcome/index.js';

vi.mock('@spotify-confidence/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@spotify-confidence/core')>()),
  runAllChecks: vi.fn().mockResolvedValue([]),
  detectInstalledPlugins: vi.fn().mockResolvedValue([]),
}));

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
      expect(sut.lastFrame()).toContain('It will check your system');
      expect(sut.lastFrame()).toContain('Sign you in to Confidence');
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

    await act(() => sut.stdin.write(ENTER));

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

  describe('when goals are preset', () => {
    it('shows tailored tagline for single goal (flags)', async () => {
      using project = createProjectDir();
      using sut = renderScreen(<WelcomeScreen />, {
        dir: project.path,
        goals: ['feature-flags'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Feature flags, set up with AI in minutes.');
      });
    });

    it('shows tailored tagline for single goal (events)', async () => {
      using project = createProjectDir();
      using sut = renderScreen(<WelcomeScreen />, {
        dir: project.path,
        goals: ['event-tracking'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Event tracking, set up with AI in minutes.');
      });
    });

    it('shows tailored tagline for multiple goals', async () => {
      using project = createProjectDir();
      using sut = renderScreen(<WelcomeScreen />, {
        dir: project.path,
        goals: ['feature-flags', 'event-tracking'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain(
          'Feature flags and event tracking, set up with AI in minutes.',
        );
      });
    });

    it('preserves default step 5 for flags-only preset', async () => {
      using project = createProjectDir();
      using sut = renderScreen(<WelcomeScreen />, {
        dir: project.path,
        goals: ['feature-flags'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Show a working feature flag example');
      });
    });

    it('shows tailored step 5 for non-flag preset', async () => {
      using project = createProjectDir();
      using sut = renderScreen(<WelcomeScreen />, {
        dir: project.path,
        goals: ['event-tracking'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Set up event tracking in your project');
      });
    });

    it('shows tailored intro for preset features', async () => {
      using project = createProjectDir();
      using sut = renderScreen(<WelcomeScreen />, {
        dir: project.path,
        goals: ['event-tracking'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain(
          'This wizard will set up event tracking in your project.',
        );
      });
    });
  });

  describe('when no known framework is detected', () => {
    it('hides "Start setup" and shows "Change framework"', async () => {
      using project = createProjectDir('empty');
      using sut = renderScreen(<WelcomeScreen />, { dir: project.path });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Could not auto-detect');
        expect(sut.lastFrame()).not.toContain('Start setup');
        expect(sut.lastFrame()).toContain('Change framework');
      });
    });

    it('navigates to SelectFramework on "Change framework"', async () => {
      using project = createProjectDir('empty');
      using sut = renderApp({ dir: project.path });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Change framework');
      });

      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Select Framework');
      });
    });
  });

  describe('when preset goals are incompatible with framework', () => {
    it('hides "Start setup" when recordings preset on non-browser framework', async () => {
      using project = createProjectDir();
      using sut = renderScreen(<WelcomeScreen />, {
        dir: project.path,
        framework: 'go',
        goals: ['session-recordings'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).not.toContain('Start setup');
        expect(sut.lastFrame()).toContain('Change framework');
      });
    });

    it('shows incompatibility notice instead of intro', async () => {
      using project = createProjectDir();
      using sut = renderScreen(<WelcomeScreen />, {
        dir: project.path,
        framework: 'go',
        goals: ['session-recordings'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Recordings not supported');
        expect(sut.lastFrame()).not.toContain('set up session recordings in your project');
      });
    });
  });
});
