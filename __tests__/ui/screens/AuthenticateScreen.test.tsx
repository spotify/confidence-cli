import { http, HttpResponse } from 'msw';
import { server } from '../../msw/server.js';
import {
  renderScreen,
  renderApp,
  createProjectDir,
  prepareAuthTokens,
  buildTestJwt,
  ENTER,
  waitFor,
} from '../testing-framework/index.js';
import { AuthenticateScreen } from '@ui/tui/screens/authenticate/index.js';
import { ScreenId } from '@lib/session.js';

// Mocking `authenticate` because it opens
// a real browser and starts a local HTTP server.
vi.mock('../../../src/lib/auth.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/auth.js')>();
  return {
    ...actual,
    authenticate: vi.fn().mockResolvedValue({
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      region: 'EU' as const,
      workspace: 'test@example.com',
    }),
  };
});

const testOpts = { screen: ScreenId.Authenticate };

describe('AuthenticateScreen', () => {
  it('renders title', async () => {
    using _auth = prepareAuthTokens('none');
    using sut = renderScreen(<AuthenticateScreen />, testOpts);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Sign in to Confidence');
    });
  });

  describe('when no existing token', () => {
    it('shows sign-in option', async () => {
      using _auth = prepareAuthTokens('none');
      using sut = renderScreen(<AuthenticateScreen />, testOpts);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Sign in to a Confidence account');
      });
    });

    it('authenticates and auto-advances on sign in', async () => {
      using _auth = prepareAuthTokens('none');
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
        expect(sut.lastFrame()).toContain('Select agent to set up');
      });
    });

    it('shows authenticated state after sign in', async () => {
      using _auth = prepareAuthTokens('none');
      using sut = renderScreen(<AuthenticateScreen />, testOpts);

      sut.stdin.write(ENTER);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Authenticated');
      });
    });
  });

  describe('when existing token is found', () => {
    it('shows existing account options', async () => {
      using _auth = prepareAuthTokens();

      using sut = renderScreen(<AuthenticateScreen />, testOpts);

      await waitFor(() => {
        expect(sut.lastFrame()).toContain('existing@example.com');
        expect(sut.lastFrame()).toContain('Use existing account');
      });
    });

    it('refreshes token when confirming existing account', async () => {
      // Arrange
      using _auth = prepareAuthTokens('with-refresh');

      server.use(
        http.post('https://auth.confidence.dev/oauth/token', () =>
          HttpResponse.json({
            access_token: buildTestJwt({ email: 'existing@example.com' }),
            refresh_token: 'new-refresh-token',
            token_type: 'Bearer',
            expires_in: 86400,
          }),
        ),
      );

      using sut = renderScreen(<AuthenticateScreen />, testOpts);
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Use existing account');
      });

      // Act
      sut.stdin.write(ENTER);

      // Assert
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Authenticated');
      });
    });

    it('falls back to sign-in when token refresh fails', async () => {
      // Arrange
      using _auth = prepareAuthTokens('with-refresh');

      server.use(
        http.post(
          'https://auth.confidence.dev/oauth/token',
          () => new HttpResponse(null, { status: 401 }),
        ),
      );

      using sut = renderScreen(<AuthenticateScreen />, testOpts);
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('Use existing account');
      });

      // Act
      sut.stdin.write(ENTER);

      // Assert
      await waitFor(() => {
        expect(sut.lastFrame()).toContain('session seems to be expired');
        expect(sut.lastFrame()).toContain('Sign in to a Confidence account');
      });
    });
  });

  describe('when authentication fails', () => {
    it('shows failure message with retry option', async () => {
      const { authenticate } = await import('../../../src/lib/auth.js');
      vi.mocked(authenticate).mockRejectedValueOnce(new Error('Network error'));

      using sut = renderScreen(<AuthenticateScreen />, testOpts);

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

      using sut = renderScreen(<AuthenticateScreen />, testOpts);

      // Trigger first attempt (fails)
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
