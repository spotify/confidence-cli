import {
  act,
  renderApp,
  createProjectDir,
  ENTER,
  ARROW_DOWN,
  SPACE,
  waitFor,
} from '../testing-framework/index.js';
import { ScreenId } from '@spotify-confidence/core';

describe('SelectGoalScreen', () => {
  describe('goal selection', () => {
    it('shows goal options for browser framework', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Select the features');
        expect(frame).toContain('Flags');
        expect(frame).toContain('Recordings');
        expect(frame).toContain('Events');
        expect(frame).toContain('space');
        expect(frame).toContain('toggle');
      });
    });

    it('shows "Select features" in the task list when goals are not pre-set', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Select features');
      });
    });

    it('shows warehouse note for event tracking', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Confidence Cloud');
        expect(sut.lastFrame()).toContain('warehouse setup');
      });
    });

    it('shows goal selection for non-browser project without recording option', async () => {
      using project = createProjectDir('empty');

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Flags');
        expect(frame).toContain('Events');
        expect(frame).not.toContain('Recordings');
      });
    });

    it('advances to InstallPlugins after selecting a goal', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Flags');
      });

      await act(() => sut.stdin.write(SPACE));
      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Log in to Confidence');
      });
    });

    it('shows validation message when submitting with nothing selected', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Flags');
      });

      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Please toggle at least one option to continue.');
        expect(sut.lastFrame()).toContain('Toggle features to set up');
      });
    });

    it('shows event tracking steps after selecting Event Tracking', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Events');
      });

      await act(() => sut.stdin.write(ARROW_DOWN + SPACE));
      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Log in to Confidence');
      });
    });

    it('shows goal selection for non-browser project with competitors', async () => {
      using project = createProjectDir('statsig-node');

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'node',
        plugins: ['claude'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Flags');
        expect(frame).toContain('Events');
        expect(frame).not.toContain('Recordings');
      });
    });

    it('auto-advances when goals are pre-set from CLI', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
        goals: ['feature-flags'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Log in to Confidence');
      });
    });

    it('omits "Select features" from the task list when goals are pre-set', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
        goals: ['feature-flags'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Log in to Confidence');
        expect(frame).not.toContain('Select features');
      });
    });

    it('auto-advances when recordings are pre-set with a browser framework', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'typescript',
        goals: ['session-recordings', 'feature-flags'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Log in to Confidence');
      });
    });
  });

  describe('incompatible preset recordings', () => {
    it('shows error when recordings are pre-set with a non-browser framework', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'python',
        goals: ['session-recordings'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Incompatible feature selection');
        expect(frame).toContain('python');
        expect(frame).toContain('Session recordings are not available');
      });
    });

    it('shows quit-only option when recordings is the sole pre-set goal', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'go',
        goals: ['session-recordings'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Quit');
        expect(frame).not.toContain('Continue without recordings');
      });
    });

    it('offers continue-without-recordings when other goals are also pre-set', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'python',
        goals: ['feature-flags', 'session-recordings'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Continue without recordings');
        expect(frame).toContain('Quit');
      });
    });

    it('advances with remaining goals after choosing continue without recordings', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'python',
        goals: ['feature-flags', 'session-recordings'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Continue without recordings');
      });

      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Log in to Confidence');
      });
    });

    it('does not auto-advance past the error', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'swift',
        goals: ['session-recordings', 'event-tracking'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Incompatible feature selection');
        expect(frame).not.toContain('Select agent to set up');
      });
    });

    it('auto-advances when recordings are pre-set with a browser framework', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'typescript',
        goals: ['session-recordings', 'feature-flags'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Select agent to set up');
      });
    });
  });

  describe('incompatible preset recordings', () => {
    it('shows error when recordings are pre-set with a non-browser framework', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'python',
        goals: ['session-recordings'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Incompatible feature selection');
        expect(frame).toContain('python');
        expect(frame).toContain('Session recordings are not available');
      });
    });

    it('shows quit-only option when recordings is the sole pre-set goal', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'go',
        goals: ['session-recordings'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Quit');
        expect(frame).not.toContain('Continue without recordings');
      });
    });

    it('offers continue-without-recordings when other goals are also pre-set', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'python',
        goals: ['feature-flags', 'session-recordings'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Continue without recordings');
        expect(frame).toContain('Quit');
      });
    });

    it('advances with remaining goals after choosing continue without recordings', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'python',
        goals: ['feature-flags', 'session-recordings'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Continue without recordings');
      });

      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Select agent to set up');
      });
    });

    it('does not auto-advance past the error', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'swift',
        goals: ['session-recordings', 'event-tracking'],
      });

      await waitFor(() => {
        const frame = sut.lastFrame()!;
        expect(frame).toContain('Incompatible feature selection');
        expect(frame).not.toContain('Select agent to set up');
      });
    });
  });
});
