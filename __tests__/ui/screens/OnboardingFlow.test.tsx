import { spawn } from 'node:child_process';
import {
  act,
  renderApp,
  renderScreen,
  createProjectDir,
  mockNextSpawn,
  ENTER,
  ARROW_DOWN,
  ESCAPE,
  SPACE,
  waitFor,
} from '../testing-framework/index.js';
import { OnboardProjectScreen } from '@ui/tui/screens/onboard-project/index.js';
import { ScreenId } from '@lib/session.js';

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, spawn: vi.fn() };
});

describe('Onboarding flow', () => {
  afterEach(() => {
    vi.mocked(spawn).mockReset();
  });

  describe('confirmation prompt', () => {
    it('shows confirmation prompt on mount', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Ready to start?');
        expect(frame).toContain('The wizard will:');
        expect(frame).toContain('add the Confidence SDK');
        expect(frame).toContain('Start onboarding?');
        expect(frame).toContain('Start');
        expect(frame).toContain('Skip');
      });
    });

    it('advances to Done on skip', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });

      sut.stdin.write(ARROW_DOWN + ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Onboarding skipped');
      });
    });
  });

  describe('when onboarding is confirmed', () => {
    it('shows progress screen after confirming', async () => {
      using project = createProjectDir();
      mockNextSpawn({ hang: true });

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).not.toContain('Start onboarding?');
        expect(sut.lastFrame()).toContain('Grab a coffee');
      });
    });

    it('shows status updates from spawned process', async () => {
      using project = createProjectDir();
      mockNextSpawn({
        lines: ['STATUS: Creating feature flag example...', 'other output without STATUS prefix'],
        hang: true,
      });

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Creating feature flag example');
        expect(sut.lastFrame()).not.toContain('other output without STATUS prefix');
      });
    });

    it('advances to Done after successful onboarding', async () => {
      using project = createProjectDir();
      mockNextSpawn({
        lines: [
          'STATUS: Installing SDK...',
          'Created confidence.config.ts',
          'Modified src/App.tsx',
        ],
      });

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Confidence is ready');
      });
    });

    it('shows error when process exits with non-zero code', async () => {
      using project = createProjectDir();
      mockNextSpawn({
        exitCode: 1,
        stderrOutput: 'Something went wrong',
      });

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Onboarding encountered an error');
        expect(sut.lastFrame()).toContain('Something went wrong');
      });
    });

    it('shows error when process fails to start', async () => {
      using project = createProjectDir();
      mockNextSpawn({
        error: new Error('spawn claude ENOENT'),
      });

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('spawn claude ENOENT');
      });
    });

    it('advances to Done on cancel from progress screen', async () => {
      using project = createProjectDir();
      mockNextSpawn({ lines: ['STATUS: Working...'], hang: true });

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('usually takes');
      });

      sut.stdin.write(ESCAPE);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Onboarding cancelled');
      });
    });

    it('shows plain time estimate for a single goal', async () => {
      using project = createProjectDir();
      mockNextSpawn({ hang: true });

      using sut = renderScreen(<OnboardProjectScreen />, {
        screen: ScreenId.OnboardProject,
        dir: project.path,
        goals: ['feature-flags'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('3–5 min.');
        expect(frame).not.toContain('per feature');
      });
    });

    it('shows per-feature time estimate for multiple goals', async () => {
      using project = createProjectDir();
      mockNextSpawn({ hang: true });

      using sut = renderScreen(<OnboardProjectScreen />, {
        screen: ScreenId.OnboardProject,
        dir: project.path,
        goals: ['feature-flags', 'session-recordings'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('3–5 min per feature');
      });
    });

    it('shows choose-sdk prompt for empty project', async () => {
      using project = createProjectDir('empty');
      mockNextSpawn({ hang: true });

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Project appears to be empty');
      });
    });
  });

  describe('IDE-specific sandbox warning', () => {
    it('shows standard warning when IDE is Claude Code', async () => {
      using project = createProjectDir();

      using sut = renderScreen(<OnboardProjectScreen />, {
        screen: ScreenId.OnboardProject,
        dir: project.path,
        ide: 'claude',
        goals: ['feature-flags'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('run commands, install packages');
        expect(frame).not.toContain('entire file system');
      });
    });

    it('shows elevated warning when IDE is Cursor', async () => {
      using project = createProjectDir();

      using sut = renderScreen(<OnboardProjectScreen />, {
        screen: ScreenId.OnboardProject,
        dir: project.path,
        ide: 'cursor',
        goals: ['feature-flags'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('entire file system');
      });
    });

    it('shows elevated warning when IDE is Codex', async () => {
      using project = createProjectDir();

      using sut = renderScreen(<OnboardProjectScreen />, {
        screen: ScreenId.OnboardProject,
        dir: project.path,
        ide: 'codex',
        goals: ['feature-flags'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('entire file system');
      });
    });
  });

  describe('selected goal display', () => {
    it('shows feature flag steps when goal is feature-flags', async () => {
      using project = createProjectDir();

      using sut = renderScreen(<OnboardProjectScreen />, {
        screen: ScreenId.OnboardProject,
        dir: project.path,
        goals: ['feature-flags'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('The wizard will:');
        expect(frame).toContain('add the Confidence SDK');
        expect(frame).toContain('create your first feature flag');
      });
    });

    it('shows session recording steps when goal is session-recordings', async () => {
      using project = createProjectDir();

      using sut = renderScreen(<OnboardProjectScreen />, {
        screen: ScreenId.OnboardProject,
        dir: project.path,
        goals: ['session-recordings'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('add the Confidence SDK');
        expect(frame).toContain('set up session recordings');
        expect(frame).not.toContain('feature flag');
      });
    });

    it('shows combined steps when multiple goals are selected', async () => {
      using project = createProjectDir();

      using sut = renderScreen(<OnboardProjectScreen />, {
        screen: ScreenId.OnboardProject,
        dir: project.path,
        goals: ['feature-flags', 'session-recordings', 'event-tracking'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('add the Confidence SDK');
        expect(frame).toContain('create your first feature flag');
        expect(frame).toContain('set up session recordings');
        expect(frame).toContain('instrument event tracking');
      });
    });
  });
  describe('when the user leaves the confirmation prompt with Escape', () => {
    it('returns to feature selection', async () => {
      using project = createProjectDir();
      using sut = renderApp({ screen: ScreenId.SelectGoal, dir: project.path });
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Toggle Confidence features');
      });

      await act(() => sut.stdin.write(SPACE));
      await act(() => sut.stdin.write(ENTER));
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });
      sut.stdin.write(ESCAPE);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Toggle features to set up');
      });
    });
  });

  describe('when onboarding fails and the user skips', () => {
    it('reports that onboarding did not finish', async () => {
      using project = createProjectDir();
      mockNextSpawn({ exitCode: 1, stderrOutput: 'Something went wrong' });
      using sut = renderApp({ screen: ScreenId.OnboardProject, dir: project.path });
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });

      sut.stdin.write(ENTER);
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Onboarding encountered an error');
      });
      await act(() => sut.stdin.write(ARROW_DOWN));
      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain("Onboarding didn't finish");
      });
    });
  });
});
