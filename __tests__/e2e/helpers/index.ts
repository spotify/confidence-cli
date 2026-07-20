import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { TerminalSession } from './pty.js';
import { ENTER, ARROW_DOWN } from './keys.js';
import { AUTH_CALLBACK_PORT } from './constants.js';
import { ONBOARDING_INVOCATION_FILE } from './mock-binaries.js';

export { TerminalSession } from './pty.js';
export { stripAnsi } from './strip-ansi.js';
export { buildTestJwt } from './jwt.js';
export { ARROW_DOWN, ARROW_UP, ENTER, ESCAPE } from './keys.js';
export { AUTH_CALLBACK_PORT } from './constants.js';
export { CHAT_PROMPT_FILE, ONBOARDING_INVOCATION_FILE } from './mock-binaries.js';

type ProjectType = 'react' | 'empty';

export function createSession({
  project = 'react',
  extraArgs = [],
  env = {},
  token,
  systemPath,
}: {
  project?: ProjectType;
  extraArgs?: string[];
  env?: Record<string, string>;
  token?: string;
  systemPath?: string;
} = {}): TerminalSession {
  const mockBinDir = process.env.E2E_MOCK_BIN_DIR!;
  const projectDir = mkdtempSync(join(tmpdir(), 'e2e-project-'));

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

export async function simulateAuthCallback(): Promise<void> {
  const maxAttempts = 50;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await fetch(`http://localhost:${AUTH_CALLBACK_PORT}/callback?code=test-auth-code`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Auth callback server not ready after ${maxAttempts * 100}ms`);
}

export async function navigatePastAuth(session: TerminalSession): Promise<void> {
  await session.waitForText('Sign in to Confidence');
  await session.waitForText('Sign in to a Confidence account');
  await session.sendKey(ENTER);
  await session.waitForText('Waiting for browser');
  await simulateAuthCallback();
  await session.waitForText('Authenticated');
}

export async function navigateToPlugins(session: TerminalSession): Promise<void> {
  await session.waitForText('Start setup');
  await session.sendKey(ENTER);
  await session.waitForText('All checks passed');
  await navigatePastAuth(session);
  await session.waitForText('Which agent tool are you using?');
  session.checkpoint();
}

export async function navigateToConnectTools(session: TerminalSession): Promise<void> {
  await navigateToPlugins(session);
  await session.sendKey(ENTER);
  await session.waitForText('Plugin installed successfully');
  await session.waitForText('Connect Confidence tools?');
  session.checkpoint();
}

export async function navigateToOnboarding(session: TerminalSession): Promise<void> {
  await navigateToConnectTools(session);
  await session.sendKey(ENTER);
  await session.waitForText('Connected successfully');
  await session.waitForText('Start onboarding?');
  session.checkpoint();
}

export type Invocation = {
  command: string;
  args: string[];
  prompt: string;
};

export async function selectIdeAndOnboard(
  session: TerminalSession,
  downPresses: number,
): Promise<void> {
  for (let i = 0; i < downPresses; i++) {
    await session.sendKey(ARROW_DOWN);
  }
  await session.sendKey(ENTER);
  await session.waitForText('Plugin installed successfully');

  // ConnectTools may auto-advance when MCP servers are already registered globally
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const screen = session.screen;
    if (screen.includes('Start onboarding?')) break;
    if (screen.includes('Connect Confidence tools?')) {
      await session.sendKey(ENTER);
      await session.waitForText('Connected successfully');
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  await session.waitForText('Start onboarding?');
  await session.sendKey(ENTER);
  await session.waitForText('onboarding complete', { timeout: 60_000 });
}

export function readInvocation(cwd: string): Invocation {
  return JSON.parse(readFileSync(join(cwd, ONBOARDING_INVOCATION_FILE), 'utf-8')) as Invocation;
}
