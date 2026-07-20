import { http, HttpResponse } from 'msw';
import {
  renderScreen,
  renderApp,
  createProjectDir,
  ENTER,
  ARROW_DOWN,
  waitFor,
  delay,
} from '../helpers/index.js';
import { ConnectToolsScreen } from '@ui/tui/screens/connect-tools/index.js';
import { ScreenId } from '@lib/session.js';
import { server } from '../../msw/server.js';

describe('ConnectToolsScreen', () => {
  it('renders title', async () => {
    using project = createProjectDir();
    using sut = renderScreen(<ConnectToolsScreen />, {
      screen: ScreenId.ConnectTools,
      dir: project.path,
    });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Connect your AI to Confidence');
    });
  });

  it('shows tool list after detection', async () => {
    using project = createProjectDir();
    using sut = renderScreen(<ConnectToolsScreen />, {
      screen: ScreenId.ConnectTools,
      dir: project.path,
    });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('confidence-flags');
      expect(sut.lastFrame()).toContain('confidence-docs');
    });
  });

  it('shows connect options', async () => {
    using project = createProjectDir();
    using sut = renderScreen(<ConnectToolsScreen />, {
      screen: ScreenId.ConnectTools,
      dir: project.path,
    });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Connect all tools');
    });
  });

  describe('when connection succeeds', () => {
    it('connects and shows success message', async () => {
      using project = createProjectDir();
      using sut = renderScreen(<ConnectToolsScreen />, {
        screen: ScreenId.ConnectTools,
        dir: project.path,
        ide: 'cursor',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Connect all tools');
      });

      await delay(0);
      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Connected successfully');
      });
    }, 10000);
  });

  describe('when connection fails', () => {
    it('shows failure message when all servers fail', async () => {
      server.use(
        http.post('https://mcp.confidence.dev/mcp/flags', () => HttpResponse.error()),
        http.post('https://mcp.confidence.dev/mcp/docs', () => HttpResponse.error()),
      );

      using project = createProjectDir();
      using sut = renderScreen(<ConnectToolsScreen />, {
        screen: ScreenId.ConnectTools,
        dir: project.path,
        ide: 'cursor',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Connect all tools');
      });

      await delay(0);
      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('not responding');
      });
    }, 10000);

    it('shows partial failure status', async () => {
      server.use(http.post('https://mcp.confidence.dev/mcp/docs', () => HttpResponse.error()));

      using project = createProjectDir();
      using sut = renderScreen(<ConnectToolsScreen />, {
        screen: ScreenId.ConnectTools,
        dir: project.path,
        ide: 'cursor',
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Connect all tools');
      });

      await delay(0);
      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('not responding');
        expect(sut.lastFrame()).not.toContain('Connected successfully');
      });
    }, 10000);
  });

  describe('when user skips', () => {
    it('shows skip confirmation and auto-advances', async () => {
      using project = createProjectDir();
      using sut = renderApp({ screen: ScreenId.ConnectTools, dir: project.path });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Skip for now');
      });

      await delay(0);
      sut.stdin.write(ARROW_DOWN + ARROW_DOWN + ARROW_DOWN + ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Skipped');
      });
    }, 10000);
  });
});
