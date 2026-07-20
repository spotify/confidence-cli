import { useEffect, useRef } from 'react';
import type { ScreenId } from '@lib/session.js';
import type { EventsFor } from '../screen-transitions.js';
import { useNavigation } from './useNavigation.js';

type AutoAdvanceOptions<S extends ScreenId> = {
  screen: S;
  when: boolean;
  delay: number;
  onAdvance?: () => void;
  event?: EventsFor<S>;
};

export function useAutoAdvance<S extends ScreenId>({
  screen,
  when,
  delay,
  onAdvance,
  event = 'next' as EventsFor<S>,
}: AutoAdvanceOptions<S>) {
  const navigate = useNavigation(screen);

  const onAdvanceRef = useRef(onAdvance);
  useEffect(function syncOnAdvance() {
    onAdvanceRef.current = onAdvance;
  });

  useEffect(
    function autoAdvance() {
      if (!when) return;
      const timer = setTimeout(() => {
        onAdvanceRef.current?.();
        navigate.to(event);
      }, delay);
      return () => clearTimeout(timer);
    },
    [when, delay, navigate, event],
  );
}
