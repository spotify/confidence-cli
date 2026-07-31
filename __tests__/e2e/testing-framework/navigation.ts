import { TerminalSession } from './terminal/index.js';
import { simulateAuthCallback } from './utils.js';

/**
 * Advances the wizard past the Welcome and SystemCheck screens.
 *
 * Waits for the welcome CTA, presses Enter, then waits for the system
 * check to pass. The session is left at the Authenticate screen.
 *
 * @param session - An active terminal session showing the Welcome screen.
 */
export async function navigatePastWelcome(session: TerminalSession): Promise<void> {
  await session.waitForText('Start setup');
  await session.press('Enter');
  await session.waitForText('All checks passed');
}

/**
 * Completes the full authentication flow via browser-simulated OAuth.
 *
 * Initiates sign-in, triggers {@link simulateAuthCallback}, and waits
 * for the "Authenticated" confirmation. The session is left at the
 * InstallPlugins screen.
 *
 * @param session - An active terminal session showing the Authenticate screen.
 */
export async function navigatePastAuth(session: TerminalSession): Promise<void> {
  await session.waitForText('Sign in to Confidence');
  await session.waitForText('Sign in to a Confidence account');
  await session.press('Enter');
  await session.waitForText('Waiting for browser');
  await simulateAuthCallback();
  await session.waitForText('Authenticated');
}

/**
 * Navigates from the start through Welcome, SystemCheck, and Auth,
 * landing on the InstallPlugins screen with a fresh checkpoint.
 *
 * @param session - An active terminal session at the Welcome screen.
 */
export async function navigateToPlugins(session: TerminalSession): Promise<void> {
  await navigatePastWelcome(session);
  await navigatePastAuth(session);
  session.checkpoint();
  await session.waitForText('Which CLI agent would you like to use?');
}

/**
 * Navigates from the start through to the ConnectTools screen,
 * selecting the default (first) IDE plugin and setting a checkpoint.
 *
 * @param session - An active terminal session at the Welcome screen.
 */
export async function navigateToConnectTools(session: TerminalSession): Promise<void> {
  await navigateToPlugins(session);
  await session.waitForText('Skip (install manually later)');
  session.checkpoint();
  await session.press('Enter');
  await session.waitForText('Connect Confidence tools?');
}

/**
 * Navigates from the start through to the OnboardProject screen,
 * accepting default tools connection and setting a checkpoint.
 *
 * @param session - An active terminal session at the Welcome screen.
 */
export async function navigateToOnboarding(session: TerminalSession): Promise<void> {
  await navigateToConnectTools(session);
  session.checkpoint();
  await session.press('Enter');
  await session.waitForText('Start onboarding?');
}

/**
 * Selects an IDE from the InstallPlugins list and runs through the
 * remaining wizard screens (ConnectTools + OnboardProject) until
 * onboarding completes.
 *
 * Handles the case where ConnectTools may auto-advance when MCP
 * servers are already registered globally.
 *
 * @param session - An active terminal session at the InstallPlugins screen.
 * @param downPresses - How many times to press ArrowDown to reach the
 *   desired IDE option (0 = first item, 1 = second, etc.).
 *
 * @example
 * ```ts
 * await navigateToPlugins(session);
 * await selectIdeAndOnboard(session, 1); // select Cursor (2nd item)
 * ```
 */
export async function selectIdeAndOnboard(
  session: TerminalSession,
  downPresses: number,
): Promise<void> {
  await session.pressRepeat('ArrowDown', downPresses);
  await session.press('Enter');

  const matched = await session.waitForText(['Start onboarding?', 'Connect Confidence tools?']);

  if (matched === 'Connect Confidence tools?') {
    await session.press('Enter');
    await session.waitForText('Connected successfully');
  }

  await session.waitForText('Start onboarding?');
  await session.press('Enter');
  await session.waitForText('onboarding complete');
}
