import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { TerminalSession } from './terminal/index.js';

/** Determines which project scaffold is written to the temp directory. */
type ProjectType = 'react' | 'empty';

/**
 * Creates an isolated {@link TerminalSession} pre-configured for e2e testing.
 *
 * Each call sets up a fresh temporary project directory with mock IDE
 * binaries on `PATH`, optional pre-seeded auth tokens, and the standard
 * e2e environment. The temp directory is registered for automatic cleanup
 * when the session is disposed (via `using`).
 *
 * @param options - Session configuration.
 * @param options.project - Project scaffold type. `'react'` writes a
 *   `package.json` with a React dependency so the wizard can auto-detect
 *   the framework. `'empty'` creates a bare directory. @defaultValue `'react'`
 * @param options.extraArgs - Additional CLI arguments.
 * @param options.env - Extra environment variables.
 * @param options.token - Pre-seed a Confidence auth token (JWT string).
 *   When set, the session writes the token to the temp directory so the
 *   wizard finds it on startup.
 * @param options.refreshToken - Refresh token written alongside the auth
 *   token. Pass `null` to simulate a missing refresh token.
 *   @defaultValue `'e2e-refresh-token'`
 * @param options.systemPath - Override `PATH` to control which system
 *   binaries the wizard's system check can find.
 * @returns A disposable {@link TerminalSession} ready for interaction.
 *
 * @example
 * ```ts
 * using session = createSession();
 * await session.waitForText('Welcome');
 *
 * // With a pre-seeded expired token
 * using session = createSession({ token: buildTestJwt({ exp: 0 }) });
 * ```
 */
export function createSession({
  project = 'react',
  extraArgs = [],
  env = {},
  token,
  refreshToken = 'e2e-refresh-token',
  systemPath,
}: {
  project?: ProjectType;
  extraArgs?: string[];
  env?: Record<string, string>;
  token?: string;
  refreshToken?: string | null;
  systemPath?: string;
} = {}): TerminalSession {
  const mockBinDir = process.env.E2E_MOCK_BIN_DIR!;
  const projectDir = mkdtempSync('/tmp/e2e-project-');

  if (project === 'react') {
    writeFileSync(
      join(projectDir, 'package.json'),
      JSON.stringify({ dependencies: { react: '^19.0.0' } }),
    );
  }

  const sessionEnv: Record<string, string> = {
    PATH: `${mockBinDir}:${systemPath ?? process.env.PATH}`,
    ...env,
  };

  if (token) {
    const tokenDir = mkdtempSync(join(tmpdir(), 'e2e-tmp-'));

    writeFileSync(join(tokenDir, 'confidence_token'), token, 'utf-8');
    if (refreshToken) {
      writeFileSync(join(tokenDir, 'confidence_refresh_token'), refreshToken, 'utf-8');
    }

    sessionEnv.TMPDIR = tokenDir;
  }

  const session = new TerminalSession({
    args: ['--debug', '--dir', projectDir, ...extraArgs],
    env: sessionEnv,
    cwd: projectDir,
  });

  session.addTempDir(projectDir);
  return session;
}
