import { renderScreen, waitFor } from '../helpers/index.js';
import { DoneScreen } from '@ui/tui/screens/done/index.js';
import { ScreenId } from '@lib/session.js';
import { store } from '@ui/tui/store.js';

vi.mock('../../../src/integrations/chat.js', () => ({
  launchChatSession: vi.fn(),
}));

describe('DoneScreen', () => {
  it('renders completion message', async () => {
    using sut = renderScreen(<DoneScreen />, { screen: ScreenId.Done });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Confidence is ready');
    });
  });

  it('shows docs URLs', async () => {
    using sut = renderScreen(<DoneScreen />, { screen: ScreenId.Done });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('confidence.spotify.com/docs');
      expect(sut.lastFrame()).toContain('app.confidence.spotify.com');
    });
  });

  it('shows only Exit when no IDE is chosen', async () => {
    using sut = renderScreen(<DoneScreen />, { screen: ScreenId.Done });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Exit');
      expect(sut.lastFrame()).not.toContain('Continue work with');
    });
  });

  it('shows continue option with chosen IDE name', async () => {
    using sut = renderScreen(<DoneScreen />, { screen: ScreenId.Done, ide: 'cursor' });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Continue work with Cursor');
    });
  });

  describe('when code changes are present', () => {
    it('shows code changes summary', async () => {
      using sut = renderScreen(<DoneScreen />, { screen: ScreenId.Done });
      store.setCodeChanges(['Added @spotify-confidence/sdk', 'Created confidence.config.ts']);
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('What we set up');
        expect(sut.lastFrame()).toContain('confidence.config.ts');
      });
    });
  });

  describe('when a report file is generated', () => {
    it('shows report file path', async () => {
      using sut = renderScreen(<DoneScreen />, { screen: ScreenId.Done });
      store.setReportFile('CONFIDENCE_QUICKSTART.md');
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('CONFIDENCE_QUICKSTART.md');
      });
    });
  });
});
