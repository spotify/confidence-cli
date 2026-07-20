import {
  renderScreen,
  renderApp,
  createProjectDir,
  ENTER,
  ESCAPE,
  waitFor,
} from '../helpers/index.js';
import { AboutScreen } from '@ui/tui/screens/about/index.js';
import { ScreenId } from '@lib/session.js';

describe('AboutScreen', () => {
  it('renders title', async () => {
    using sut = renderScreen(<AboutScreen />, { screen: ScreenId.About });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('About Confidence');
    });
  });

  it('shows platform description', async () => {
    using sut = renderScreen(<AboutScreen />, { screen: ScreenId.About });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('feature flagging');
      expect(sut.lastFrame()).toContain('experimentation platform');
    });
  });

  it('shows docs and dashboard URLs', async () => {
    using sut = renderScreen(<AboutScreen />, { screen: ScreenId.About });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('confidence.spotify.com/docs');
      expect(sut.lastFrame()).toContain('app.confidence.spotify.com');
    });
  });

  it('navigates back on "Back"', async () => {
    using project = createProjectDir();
    using sut = renderApp({ screen: ScreenId.About, dir: project.path });

    sut.stdin.write(ENTER);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Confidence Quickstart');
    });
  });

  it('navigates back on Escape', async () => {
    using project = createProjectDir();
    using sut = renderApp({ screen: ScreenId.About, dir: project.path });

    sut.stdin.write(ESCAPE);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Confidence Quickstart');
    });
  });
});
