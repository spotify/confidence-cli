import { useMemo } from 'react';
import type { ScreenId } from '@lib/session.js';
import type { EventsFor } from '../screen-transitions.js';
import { useRouter } from './useRouter.js';

export function useNavigation<S extends ScreenId>(_screen: S) {
  const router = useRouter();
  return useMemo(
    () => ({
      to: (event: EventsFor<S>) => router.to(event),
      back: () => router.back(),
    }),
    [router],
  );
}
