import { renderScreen, renderApp, ENTER, waitFor } from '../helpers/index.js';
import { SystemCheckScreen } from '@ui/tui/screens/system-check/index.js';
import { ScreenId } from '@lib/session.js';

const mockRunAllChecks = vi.fn();

vi.mock('../../../src/lib/system-check.js', () => ({
  runAllChecks: (...args: unknown[]) => mockRunAllChecks(...args),
}));

vi.mock('../../../src/integrations/plugins.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/integrations/plugins.js')>();
  return {
    ...actual,
    detectInstalledPlugins: vi.fn().mockReturnValue([]),
  };
});

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

    it('auto-advances to Authenticate', async () => {
      using sut = renderApp({ screen: ScreenId.SystemCheck });
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Sign in to Confidence');
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
