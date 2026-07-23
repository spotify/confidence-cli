import { spawn } from 'node:child_process';
import {
  act,
  renderApp,
  createProjectDir,
  mockNextSpawn,
  ENTER,
  ARROW_DOWN,
  ESCAPE,
  waitFor,
} from '../helpers/index.js';
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
      using project = createProjectDir({ react: '^19.0.0' });

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Set up your project');
        expect(frame).toContain('Start onboarding?');
        expect(frame).toContain('Start');
        expect(frame).toContain('Skip');
      });
    });

    it('advances to Done on skip', async () => {
      using project = createProjectDir({ react: '^19.0.0' });

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
    it('shows Feature Flags heading on progress screen', async () => {
      using project = createProjectDir({ react: '^19.0.0' });
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
        expect(sut.lastFrame()).toContain('Feature Flags');
      });
    });

    it('shows status updates from spawned process', async () => {
      using project = createProjectDir({ react: '^19.0.0' });
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
      using project = createProjectDir({ react: '^19.0.0' });
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
      using project = createProjectDir({ react: '^19.0.0' });
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
      using project = createProjectDir({ react: '^19.0.0' });
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
      using project = createProjectDir({ react: '^19.0.0' });
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
        expect(sut.lastFrame()).toContain('Onboarding skipped');
      });
    });

    it('shows choose-sdk prompt for empty project', async () => {
      using project = createProjectDir(null);
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

  describe('when competitor is detected', () => {
    it('shows migration option instead of plain Start if AI plugin is installed', async () => {
      using project = createProjectDir({
        react: '^19.0.0',
        '@statsig/js-client': '^1.0.0',
      });

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
        installedPlugins: ['claude'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Found Statsig in code. How would you like to proceed?');
        expect(frame).toContain('Just integrate Confidence');
        expect(frame).toContain("Integrate and migrate Statsig's flags");
      });
    });

    it('shows standard options when no AI plugin is installed', async () => {
      using project = createProjectDir({
        react: '^19.0.0',
        '@statsig/js-client': '^1.0.0',
      });

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Start');
        expect(frame).not.toContain('Just integrate Confidence');
        expect(frame).not.toContain('migrate');
      });
    });

    it('starts onboarding with migration when migration option is selected', async () => {
      using project = createProjectDir({
        react: '^19.0.0',
        '@statsig/js-client': '^1.0.0',
      });
      mockNextSpawn({ hang: true });

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
        installedPlugins: ['claude'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain("Integrate and migrate Statsig's flags");
      });

      await act(() => sut.stdin.write(ARROW_DOWN + ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Feature Flags');
      });
    });

    it('shows migrate-all option and per-competitor options when multiple detected', async () => {
      using project = createProjectDir({
        react: '^19.0.0',
        'posthog-js': '^1.0.0',
        '@statsig/js-client': '^1.0.0',
      });

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
        installedPlugins: ['claude'],
      });

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
      using project = createProjectDir({
        react: '^19.0.0',
        '@statsig/js-client': '^1.0.0',
      });

      using sut = renderApp({
        screen: ScreenId.OnboardProject,
        dir: project.path,
        installedPlugins: ['claude'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain("Integrate and migrate Statsig's flags");
        expect(frame).not.toContain('migrate all');
      });
    });
  });
});
