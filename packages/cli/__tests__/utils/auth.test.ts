import { prepareAuthTokens, buildTestJwt } from '@spotify-confidence/testing/auth';
import { server, tokenResponse, tokenError } from '@spotify-confidence/testing';
import { captureOutput } from '../helpers/capture.js';
import { simulateTTY } from '../helpers/simulate-tty.js';

import type { AuthResult } from '@spotify-confidence/core';

const mockAuthenticate = vi.fn<() => Promise<AuthResult>>();

vi.mock('@spotify-confidence/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@spotify-confidence/core')>()),
  authenticate: (...args: unknown[]) => mockAuthenticate(...(args as [])),
}));

const { tryResolveAuth } = await import('@utils/auth.js');

describe('resolveToken', () => {
  it('returns a valid persisted token without triggering login', async () => {
    using _auth = prepareAuthTokens('valid');
    using output = captureOutput();

    const sut = await tryResolveAuth();

    expect(sut).toBeTruthy();
    expect(mockAuthenticate).not.toHaveBeenCalled();
    expect(output.stdout).toBe('');
  });

  it('refreshes an expired token when refresh token is available', async () => {
    using _auth = prepareAuthTokens('stale');
    using output = captureOutput();
    const freshToken = buildTestJwt({ email: 'refreshed@example.com' });
    server.use(tokenResponse(freshToken));

    const sut = await tryResolveAuth();

    expect(sut).toBe(freshToken);
    expect(mockAuthenticate).not.toHaveBeenCalled();
    expect(output.stdout).toBe('');
  });

  it('triggers interactive login when not logged in and TTY is available', async () => {
    using _auth = prepareAuthTokens('none');
    using _tty = simulateTTY(true);
    using output = captureOutput();
    const freshToken = buildTestJwt({ email: 'new@example.com' });
    mockAuthenticate.mockResolvedValue({
      accessToken: freshToken,
      region: 'EU',
      workspace: 'test-ws',
    });

    const sut = await tryResolveAuth();

    expect(sut).toBe(freshToken);
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(output.stdout).toContain('Not logged in to Confidence');
    expect(output.stdout).toContain('Opening browser');
    expect(output.stdout).toContain('Authenticated as test-ws (EU)');
  });

  it('triggers login after refresh failure in interactive mode', async () => {
    using _auth = prepareAuthTokens('stale');
    using _tty = simulateTTY(true);
    using output = captureOutput();
    server.use(tokenError());
    const freshToken = buildTestJwt({ email: 'reauth@example.com' });
    mockAuthenticate.mockResolvedValue({
      accessToken: freshToken,
      region: 'US',
      workspace: 'ws-2',
    });

    const sut = await tryResolveAuth();

    expect(sut).toBe(freshToken);
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(output.stdout).toContain('Session expired');
    expect(output.stdout).toContain('Opening browser to re-authenticate');
  });

  it('fails with error in non-interactive mode when not logged in', async () => {
    using _auth = prepareAuthTokens('none');
    using output = captureOutput();

    const sut = await tryResolveAuth();

    expect(sut).toBeNull();
    expect(output.stderr).toContain('Not logged in');
    expect(mockAuthenticate).not.toHaveBeenCalled();
  });

  it('fails with error in non-interactive mode when token is expired', async () => {
    using _auth = prepareAuthTokens('expired');
    using output = captureOutput();

    const sut = await tryResolveAuth();

    expect(sut).toBeNull();
    expect(output.stderr).toContain('Token expired');
    expect(mockAuthenticate).not.toHaveBeenCalled();
  });

  it('reports login failure when authentication throws', async () => {
    using _auth = prepareAuthTokens('none');
    using _tty = simulateTTY(true);
    using output = captureOutput();
    mockAuthenticate.mockRejectedValue(new Error('Port 8084 in use'));

    const sut = await tryResolveAuth();

    expect(sut).toBeNull();
    expect(output.stderr).toContain('Login failed');
  });

  it('passes profile through to authenticate', async () => {
    using _auth = prepareAuthTokens('none');
    using _tty = simulateTTY(true);
    using _output = captureOutput();
    const freshToken = buildTestJwt();
    mockAuthenticate.mockResolvedValue({
      accessToken: freshToken,
      region: 'EU',
      workspace: 'ws',
    });

    await tryResolveAuth('staging');

    expect(mockAuthenticate).toHaveBeenCalledWith(expect.objectContaining({ profile: 'staging' }));
  });
});
