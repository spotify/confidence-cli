import { useMemo } from 'react';
import { WizardRouter } from './router.js';
import { SCREEN_TRANSITIONS } from './screen-transitions.js';
import { ScreenContainer } from './components/ScreenContainer.js';
import { createScreens } from './screen-registry.js';
import { RouterContext } from './hooks/useRouter.js';
import { useTelemetry } from './hooks/useTelemetry.js';

export function App() {
  const router = useMemo(() => new WizardRouter(SCREEN_TRANSITIONS), []);
  const screens = useMemo(() => createScreens(), []);

  useTelemetry();

  return (
    <RouterContext.Provider value={router}>
      <ScreenContainer screens={screens} />
    </RouterContext.Provider>
  );
}
