import {
  act,
  renderApp,
  createProjectDir,
  ENTER,
  ARROW_DOWN,
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
        expect(frame).toContain('Which features would you like to set up?');
        expect(frame).toContain('Feature Flags');
        expect(frame).toContain('Session Recording');
        expect(frame).toContain('YOLO');
        expect(frame).toContain('Skip setup');
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

    it('auto-skips to OnboardProject for unknown framework', async () => {
      using project = createProjectDir('empty');

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Ready to start?');
        expect(sut.lastFrame()).toContain('Start onboarding?');
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

      await act(() => sut.stdin.write(ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Ready to start?');
        expect(sut.lastFrame()).toContain('create your first feature flag');
      });
    });

    it('advances to Done when skip is selected', async () => {
      using project = createProjectDir();

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'react',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Skip setup');
      });

      await act(() => sut.stdin.write(ARROW_DOWN.repeat(3) + ENTER));

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Onboarding skipped');
      });
    });

    it('auto-skips for non-browser project with competitors', async () => {
      using project = createProjectDir('statsig-node');

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'node',
        plugins: ['claude'],
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Ready to start?');
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });
    });

    it('skips directly to OnboardProject for non-browser project without competitors', async () => {
      using project = createProjectDir('empty');

      using sut = renderApp({
        screen: ScreenId.SelectGoal,
        dir: project.path,
        framework: 'node',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Ready to start?');
        expect(sut.lastFrame()).toContain('Start onboarding?');
      });
    });
  });
});
