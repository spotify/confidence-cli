import {
  act,
  renderScreen,
  renderApp,
  createProjectDir,
  ENTER,
  ARROW_DOWN,
  waitFor,
} from '../testing-framework/index.js';
import { $session } from '@ui/tui/store.js';
import { SelectGoalScreen } from '@ui/tui/screens/select-goal/index.js';
import { ScreenId } from '@lib/session.js';

describe('SelectGoalScreen', () => {
  describe('goal selection', () => {
    it('shows goal options for browser framework', async () => {
      using project = createProjectDir();

      using sut = renderScreen(<SelectGoalScreen />, {
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Which features would you like to set up?');
        expect(frame).toContain('Feature Flags');
        expect(frame).toContain('Session Recording');
        expect(frame).toContain('YOLO');
        expect(frame).toContain('Skip setup');
      });
    });

    it('shows account access note when recording is available', async () => {
      using project = createProjectDir();

      using sut = renderScreen(<SelectGoalScreen />, {
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('require the feature to be enabled');
        expect(sut.lastFrame()).toContain('Confidence account');
      });
    });

    it('auto-skips to OnboardProject for unknown framework', async () => {
      using project = createProjectDir('empty');

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Set up your project');
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });
    });

    it('advances to OnboardProject after selecting a goal', async () => {
      using project = createProjectDir();

      using sut = renderScreen(<SelectGoalScreen />, {
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Feature Flags');
      });

      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect($session.get().currentScreen).toBe(ScreenId.OnboardProject);
      });
    });

    it('advances to Done when skip is selected', async () => {
      using project = createProjectDir();

      using sut = renderScreen(<SelectGoalScreen />, {
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Skip setup');
      });

      await act(() => sut.stdin.write(ARROW_DOWN.repeat(3) + ENTER));

      await waitFor(() => {
        expect($session.get().currentScreen).toBe(ScreenId.Done);
      });
    });
  });

  describe('migration sub-phase', () => {
    it('shows migration options when competitor detected and plugins installed', async () => {
      using project = createProjectDir('react-statsig');

      using sut = renderScreen(<SelectGoalScreen />, {
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
        installedPlugins: ['claude'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Feature Flags');
      });

      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Found Statsig in code. How would you like to proceed?');
        expect(frame).toContain('Just integrate Confidence');
        expect(frame).toContain("Integrate and migrate Statsig's flags");
      });
    });

    it('skips migration when goal is session-recording only', async () => {
      using project = createProjectDir('react-statsig');

      using sut = renderScreen(<SelectGoalScreen />, {
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
        installedPlugins: ['claude'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Session Recording');
      });

      await act(() => sut.stdin.write(ARROW_DOWN + ENTER));

      await waitFor(() => {
        expect($session.get().currentScreen).toBe(ScreenId.OnboardProject);
        expect($session.get().onboardingGoal).toBe('session-recordings');
      });
    });

    it('skips migration when no plugins installed', async () => {
      using project = createProjectDir('react-statsig');

      using sut = renderScreen(<SelectGoalScreen />, {
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Feature Flags');
      });

      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect($session.get().currentScreen).toBe(ScreenId.OnboardProject);
        expect($session.get().onboardingGoal).toBe('feature-flags');
      });
    });

    it('shows migrate-all option when multiple competitors detected', async () => {
      using project = createProjectDir('react-posthog-statsig');

      using sut = renderScreen(<SelectGoalScreen />, {
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
        installedPlugins: ['claude'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Feature Flags');
      });

      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain(
          'Found PostHog and Statsig in code. How would you like to proceed?',
        );
        expect(frame).toContain('Integrate and migrate all existing flags');
        expect(frame).toContain("Integrate and migrate PostHog's flags");
        expect(frame).toContain("Integrate and migrate Statsig's flags");
      });
    });

    it('does not show migrate-all when only one competitor detected', async () => {
      using project = createProjectDir('react-statsig');

      using sut = renderScreen(<SelectGoalScreen />, {
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
        installedPlugins: ['claude'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Feature Flags');
      });

      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain("Integrate and migrate Statsig's flags");
        expect(frame).not.toContain('migrate all');
      });
    });

    it('navigates after migration selection', async () => {
      using project = createProjectDir('react-statsig');

      using sut = renderScreen(<SelectGoalScreen />, {
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
        installedPlugins: ['claude'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Feature Flags');
      });

      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain("Integrate and migrate Statsig's flags");
      });

      await act(() => sut.stdin.write(ARROW_DOWN + ENTER));

      await waitFor(() => {
        expect($session.get().currentScreen).toBe(ScreenId.OnboardProject);
        expect($session.get().migrationTargets).toHaveLength(1);
      });
    });

    it('shows migration directly for non-browser project with competitors', async () => {
      using project = createProjectDir('statsig-node');

      using sut = renderScreen(<SelectGoalScreen />, {
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'node',
        installedPlugins: ['claude'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Migrate existing flags?');
        expect(frame).toContain("Integrate and migrate Statsig's flags");
        expect(frame).not.toContain('Session Recording');
      });
    });
  });
});
