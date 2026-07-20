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

  it('shows default exit options', async () => {
    using sut = renderScreen(<DoneScreen />, { screen: ScreenId.Done });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Chat about Confidence');
      expect(sut.lastFrame()).toContain('Exit');
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

    it('shows "Ask about the changes" option', async () => {
      using sut = renderScreen(<DoneScreen />, { screen: ScreenId.Done });
      store.setCodeChanges(['Added SDK dependency']);
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Ask about the changes');
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
