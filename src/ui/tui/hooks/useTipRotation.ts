import { useState, useEffect } from 'react';
import { CONFIDENCE_TIPS, type Tip } from '../lib/tips.js';

export function useTipRotation(active: boolean, intervalMs = 15000): Tip {
  const [index, setIndex] = useState(0);

  useEffect(
    function rotateTipsOnInterval() {
      if (!active) return;
      const timer = setInterval(() => {
        setIndex((prev) => (prev + 1) % CONFIDENCE_TIPS.length);
      }, intervalMs);
      return () => clearInterval(timer);
    },
    [active, intervalMs],
  );

  return CONFIDENCE_TIPS[index];
}
