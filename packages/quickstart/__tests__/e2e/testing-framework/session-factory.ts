import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { TerminalSession } from './terminal/index.js';
import { createProjectDir, type ProjectType } from '@spotify-confidence/testing/scaffold';

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
 * @param options.config - Pre-seed Confidence config values (e.g. `{ ide: 'cursor' }`).
 *   Written to `config.json` in the session's config directory.
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
  config,
  systemPath,
}: {
  project?: ProjectType;
  extraArgs?: string[];
  env?: Record<string, string>;
  token?: string;
  refreshToken?: string | null;
  config?: Record<string, string>;
  systemPath?: string;
} = {}): TerminalSession {
  const mockBinDir = process.env.E2E_MOCK_BIN_DIR!;
  const { path: projectDir } = createProjectDir(project);

  const sessionEnv: Record<string, string> = {
    PATH: `${mockBinDir}${delimiter}${systemPath ?? process.env.PATH}`,
    ...env,
  };

  if (token || config) {
    const configDir = mkdtempSync(join(tmpdir(), 'e2e-config-'));
    seedConfigDir(configDir, { token, refreshToken, config });
    sessionEnv.CONFIDENCE_CONFIG_DIR = configDir;
  }

  const session = new TerminalSession({
    args: ['--debug', '--dir', projectDir, ...extraArgs],
    env: sessionEnv,
    cwd: projectDir,
  });

  session.addTempDir(projectDir);
  return session;
}

function seedConfigDir(
  dir: string,
  opts: {
    token?: string;
    refreshToken?: string | null;
    config?: Record<string, string>;
  },
): void {
  if (opts.token) {
    const credentials: Record<string, string> = { accessToken: opts.token };
    if (opts.refreshToken) credentials.refreshToken = opts.refreshToken;
    writeFileSync(join(dir, 'credentials.json'), JSON.stringify(credentials), 'utf-8');
  }

  if (opts.config) {
    writeFileSync(join(dir, 'config.json'), JSON.stringify(opts.config), 'utf-8');
  }
}
