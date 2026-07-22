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

const DEFAULT_TIMEOUT = 30_000;

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
  const deadline = Date.now() + DEFAULT_TIMEOUT;
  let backoff = 50;

  while (Date.now() < deadline) {
    try {
      await fetch(`http://localhost:${AUTH_CALLBACK_PORT}/callback?code=test-auth-code`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, backoff));
      backoff = Math.min(backoff * 2, 500);
    }
  }
  throw new Error(`Auth callback server not ready after ${DEFAULT_TIMEOUT / 1000}s`);
}

export async function navigatePastWelcome(session: TerminalSession): Promise<void> {
  await session.waitForText('Start setup');
  await session.sendKey(ENTER);
  await session.waitForText('All checks passed');
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
  await navigatePastWelcome(session);
  await navigatePastAuth(session);
  session.checkpoint();
  await session.waitForText('Which agent tool are you using?');
}

export async function navigateToConnectTools(session: TerminalSession): Promise<void> {
  await navigateToPlugins(session);
  await session.waitForText('Skip (install manually later)');
  session.checkpoint();
  await session.sendKey(ENTER);
  await session.waitForText('Connect Confidence tools?');
}

export async function navigateToOnboarding(session: TerminalSession): Promise<void> {
  await navigateToConnectTools(session);
  session.checkpoint();
  await session.sendKey(ENTER);
  await session.waitForText('Start onboarding?');
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
  await session.sendKeyRepeat(ARROW_DOWN, downPresses);
  await session.sendKey(ENTER);

  // ConnectTools may auto-advance when MCP servers are already registered globally
  const matched = await session.waitForText([
    'Start onboarding?',
    'Connect Confidence tools?',
  ]);

  if (matched === 'Connect Confidence tools?') {
    await session.sendKey(ENTER);
    await session.waitForText('Connected successfully');
  }

  await session.waitForText('Start onboarding?');
  await session.sendKey(ENTER);
  await session.waitForText('onboarding complete');
}

export function readInvocation(cwd: string): Invocation {
  return JSON.parse(readFileSync(join(cwd, ONBOARDING_INVOCATION_FILE), 'utf-8')) as Invocation;
}
