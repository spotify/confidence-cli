import {
  act,
  renderApp,
  createProjectDir,
  ENTER,
  ARROW_DOWN,
  SPACE,
  waitFor,
} from '../testing-framework/index.js';
import { ScreenId } from '@lib/session.js';

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
        expect(frame).toContain('Feature Flags');
        expect(frame).toContain('Session Recording');
        expect(frame).toContain('Event Tracking');
        expect(frame).toContain('space');
        expect(frame).toContain('toggle');
      });
    });

    it('shows account access note when recording is available', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('require the feature to be enabled');
        expect(sut.lastFrame()).toContain('Confidence account');
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
        expect(sut.lastFrame()).toContain('managed warehouse');
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
        expect(frame).toContain('Feature Flags');
        expect(frame).toContain('Event Tracking');
        expect(frame).not.toContain('Session Recording');
      });
    });

    it('advances to OnboardProject after selecting a goal', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Feature Flags');
      });

      await act(() => sut.stdin.write(SPACE));
      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Ready to start?');
        expect(sut.lastFrame()).toContain('create your first feature flag');
      });
    });

    it('advances to Done when submitting with nothing selected', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Feature Flags');
      });

      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Onboarding skipped');
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
        expect(sut.lastFrame()).toContain('Event Tracking');
      });

      await act(() => sut.stdin.write(ARROW_DOWN + SPACE));
      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Ready to start?');
        expect(sut.lastFrame()).toContain('instrument event tracking');
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
        expect(frame).toContain('Feature Flags');
        expect(frame).toContain('Event Tracking');
        expect(frame).not.toContain('Session Recording');
      });
    });
  });
});
