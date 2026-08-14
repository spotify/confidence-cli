import { spawn } from 'node:child_process';
import {
  renderApp,
  createProjectDir,
  mockNextSpawn,
  ENTER,
  ARROW_DOWN,
  ESCAPE,
  waitFor,
} from '../testing-framework/index.js';
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
        expect(frame).toContain('Set up your project');
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
        expect(sut.lastFrame()).toContain('Set up your project');
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
        expect(sut.lastFrame()).toContain('Onboarding skipped');
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
});
