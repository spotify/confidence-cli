import { renderScreen, renderApp, createProjectDir, ENTER, waitFor } from '../helpers/index.js';
import { AuthenticateScreen } from '@ui/tui/screens/authenticate/index.js';
import { ScreenId } from '@lib/session.js';

vi.mock('../../../src/lib/auth.js', () => ({
  loadPersistedToken: vi.fn().mockReturnValue(null),
  validateToken: vi.fn().mockReturnValue({ valid: false }),
  authenticate: vi.fn().mockResolvedValue({
    accessToken: 'test-token',
    refreshToken: 'test-refresh',
    region: 'EU' as const,
    workspace: 'test@example.com',
  }),
}));

describe('AuthenticateScreen', () => {
  it('renders title', async () => {
    using sut = renderScreen(<AuthenticateScreen />, { screen: ScreenId.Authenticate });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Sign in to Confidence');
    });
  });

  describe('when no existing token', () => {
    it('shows sign-in option', async () => {
      using sut = renderScreen(<AuthenticateScreen />, { screen: ScreenId.Authenticate });
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Sign in to a Confidence account');
      });
    });

    it('authenticates and auto-advances on sign in', async () => {
      using project = createProjectDir();
      using sut = renderApp({
        screen: ScreenId.Authenticate,
        dir: project.path,
        ide: 'cursor',
      });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Authenticated');
        expect(sut.lastFrame()).toContain('test@example.com');
      });

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Teach your AI about Confidence');
      });
    });

    it('shows authenticated state after sign in', async () => {
      using sut = renderScreen(<AuthenticateScreen />, { screen: ScreenId.Authenticate });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Authenticated');
      });
    });
  });

  describe('when existing token is found', () => {
    it('shows existing account options', async () => {
      const { loadPersistedToken, validateToken } = await import('../../../src/lib/auth.js');
      vi.mocked(loadPersistedToken).mockReturnValueOnce('existing-jwt');
      vi.mocked(validateToken).mockReturnValueOnce({
        valid: true,
        region: 'EU',
        workspace: 'existing@example.com',
      });

      using sut = renderScreen(<AuthenticateScreen />, { screen: ScreenId.Authenticate });
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('existing@example.com');
        expect(sut.lastFrame()).toContain('Use existing account');
      });
    });
  });

  describe('when authentication fails', () => {
    it('shows failure message with retry option', async () => {
      const { authenticate } = await import('../../../src/lib/auth.js');
      vi.mocked(authenticate).mockRejectedValueOnce(new Error('Network error'));

      using sut = renderScreen(<AuthenticateScreen />, { screen: ScreenId.Authenticate });

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('failed');
        expect(sut.lastFrame()).toContain('Try again');
      });
    });

    it('allows retrying after failure', async () => {
      // Arrange
      const { authenticate } = await import('../../../src/lib/auth.js');
      vi.mocked(authenticate)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          accessToken: 'retry-token',
          refreshToken: 'retry-refresh',
          region: 'EU' as const,
          workspace: 'retry@example.com',
        });
      using sut = renderScreen(<AuthenticateScreen />, { screen: ScreenId.Authenticate });

      // Act — trigger first attempt (fails)
      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Try again');
      });

      // Act — retry (succeeds)
      sut.stdin.write(ENTER);

      // Assert
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Sign in to a Confidence account');
      });
    });
  });
});
