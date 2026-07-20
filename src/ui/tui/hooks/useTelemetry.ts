import { useEffect, useRef } from 'react';
import { $session } from '../store.js';
import { getTelemetry } from '@lib/telemetry.js';
import { ScreenId } from '@lib/session.js';
import { screenEntered } from '../lib/telemetry-events.js';

function completionForScreen(screen: ScreenId): 'starting' | 'in_progress' | 'completing' | 'done' {
  switch (screen) {
    case ScreenId.Welcome:
      return 'starting';
    case ScreenId.OnboardProject:
      return 'completing';
    case ScreenId.Done:
      return 'done';
    case ScreenId.SystemCheck:
    case ScreenId.InstallPlugins:
    case ScreenId.Authenticate:
    case ScreenId.ConnectTools:
    case ScreenId.About:
    case ScreenId.SelectFramework:
      return 'in_progress';
    default: {
      const _exhaustive: never = screen satisfies never;
      throw new Error(`Unhandled: ${_exhaustive}`);
    }
  }
}

export function useTelemetry(): void {
  const prevScreenRef = useRef($session.get().currentScreen);
  const prevRegionRef = useRef($session.get().authState.region);

  useEffect(function trackInitialScreenAndSubscribe() {
    const telemetry = getTelemetry();
    const initial = $session.get();

    telemetry.track(
      screenEntered(initial.currentScreen, completionForScreen(initial.currentScreen)),
    );

    const unsubscribe = $session.listen(function onSessionChange(session) {
      if (session.currentScreen !== prevScreenRef.current) {
        prevScreenRef.current = session.currentScreen;
        telemetry.track(
          screenEntered(session.currentScreen, completionForScreen(session.currentScreen)),
        );
      }

      const newRegion = session.authState.region;
      if (newRegion && newRegion !== prevRegionRef.current) {
        prevRegionRef.current = newRegion;
        telemetry.updateRegion(newRegion);
      }
    });

    return unsubscribe;
  }, []);
}
