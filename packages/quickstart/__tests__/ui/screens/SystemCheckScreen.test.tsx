import { renderScreen, renderApp, ENTER, waitFor } from '../testing-framework/index.js';
import { SystemCheckScreen } from '@ui/screens/system-check/index.js';
import { ScreenId } from '@spotify-confidence/core';

const mockRunAllChecks = vi.fn();

vi.mock('@spotify-confidence/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@spotify-confidence/core')>()),
  runAllChecks: (...args: unknown[]) => mockRunAllChecks(...args),
  detectInstalledPlugins: vi.fn().mockResolvedValue([]),
}));

describe('SystemCheckScreen', () => {
  beforeEach(() => {
    mockRunAllChecks.mockReset();
    mockRunAllChecks.mockResolvedValue([
      { name: 'Node.js', found: true, version: 'v20.0.0' },
      { name: 'Git', found: true, version: '2.40.0' },
    ]);
  });

  it('renders title', async () => {
    using sut = renderScreen(<SystemCheckScreen />, { screen: ScreenId.SystemCheck });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('System Check');
    });
  });

  describe('when all checks pass', () => {
    it('shows check results with versions', async () => {
      using sut = renderScreen(<SystemCheckScreen />, { screen: ScreenId.SystemCheck });
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Node.js');
        expect(sut.lastFrame()).toContain('v20.0.0');
        expect(sut.lastFrame()).toContain('Git');
        expect(sut.lastFrame()).toContain('2.40.0');
      });
    });

    it('shows success message', async () => {
      using sut = renderScreen(<SystemCheckScreen />, { screen: ScreenId.SystemCheck });
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('All checks passed');
      });
    });

    it('auto-advances to SelectGoal', async () => {
      using sut = renderApp({ screen: ScreenId.SystemCheck });
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Select the features');
      });
    });
  });

  describe('when some checks fail', () => {
    it('shows error and retry option', async () => {
      mockRunAllChecks.mockResolvedValue([
        { name: 'Node.js', found: true, version: 'v20.0.0' },
        { name: 'Git', found: false },
      ]);

      using sut = renderScreen(<SystemCheckScreen />, { screen: ScreenId.SystemCheck });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('missing');
        expect(sut.lastFrame()).toContain('Retry');
      });
    });

    it('retries checks on Retry and shows success', async () => {
      mockRunAllChecks
        .mockResolvedValueOnce([
          { name: 'Node.js', found: true, version: 'v20.0.0' },
          { name: 'Git', found: false },
        ])
        .mockResolvedValueOnce([
          { name: 'Node.js', found: true, version: 'v20.0.0' },
          { name: 'Git', found: true, version: '2.40.0' },
        ]);

      using sut = renderScreen(<SystemCheckScreen />, { screen: ScreenId.SystemCheck });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Retry');
      });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('All checks passed');
      });
    });
  });
});
