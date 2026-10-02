export { TerminalSession } from './terminal/index.js';
export { createSession } from './session-factory.js';
export {
  startMockServer,
  type MockServer,
  createMockBinDir,
  buildTestJwt,
  CHAT_PROMPT_FILE,
  ONBOARDING_INVOCATION_FILE,
} from './mocks/index.js';
export { AUTH_CALLBACK_PORT } from './env.js';
export { simulateAuthCallback, readInvocation, type Invocation } from './utils.js';
export {
  navigatePastWelcome,
  navigatePastGoalSelection,
  navigatePastAuth,
  navigateToPlugins,
  navigateToConnectTools,
  navigateToGoalSelection,
  navigateToOnboarding,
  selectIdeAndOnboard,
} from './navigation.js';
