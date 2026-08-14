import type { ReactElement } from 'react';
import { render } from 'ink-testing-library';
import { store, type StoreOptions } from '@ui/tui/store.js';
import { WizardRouter } from '@ui/tui/router.js';
import { SCREEN_TRANSITIONS } from '@ui/tui/screen-transitions.js';
import { RouterContext } from '@ui/tui/hooks/useRouter.js';
import { App } from '@ui/tui/App.js';
import type { AuthState, OnboardingGoal, ScreenId } from '@lib/session.js';
import type { ChosenIde } from '@lib/session.js';

// ink-testing-library's Stdout provides columns (100) but not rows,
// so useTerminalSize defaults to 24 — below SHORT_THRESHOLD (28).
// Patch the Stdout prototype once so all renders get a realistic height.
const probe = render(<></>);
const stdoutProto = Object.getPrototypeOf((probe as Record<string, unknown>).stdout);
Object.defineProperty(stdoutProto, 'rows', { get: () => 40, configurable: true });
probe.unmount();

type RenderAppOptions = StoreOptions & {
  screen?: ScreenId;
  ide?: ChosenIde;
  installedPlugins?: string[];
};

type RenderScreenOptions = RenderAppOptions & {
  authState?: AuthState;
  framework?: string;
  goal?: OnboardingGoal;
};

export function renderScreen(element: ReactElement, opts?: RenderScreenOptions) {
  setupStore(opts);
  const router = new WizardRouter(SCREEN_TRANSITIONS);

  const result = render(<RouterContext.Provider value={router}>{element}</RouterContext.Provider>);

  return {
    ...result,
    cleanup: result.unmount,
    [Symbol.dispose]: result.unmount,
  };
}

export function renderApp(opts?: RenderAppOptions) {
  setupStore(opts);
  const result = render(<App />);

  return {
    ...result,
    cleanup: result.unmount,
    [Symbol.dispose]: result.unmount,
  };
}

function setupStore(opts: RenderScreenOptions | RenderAppOptions = {}): void {
  store.init(opts);

  if (opts.screen) store.navigateTo(opts.screen);
  if (opts.ide) store.setIde(opts.ide);
  if (opts.installedPlugins) store.setInstalledPlugins(opts.installedPlugins);

  setupScreenOptions(opts);
}

function setupScreenOptions(opts: RenderScreenOptions) {
  if (opts.authState) store.setAuthState(opts.authState);
  if (opts.framework) store.setFramework(opts.framework);
  if (opts.goal) store.setOnboardingGoal(opts.goal);
}
