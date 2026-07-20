import { useEffect, useState } from 'react';
import { detectFramework } from '@frameworks/index.js';
import { useSession, store, isStaleSession } from '../store.js';

export function useFrameworkDetection(): boolean {
  const session = useSession();
  const [attempted, setAttempted] = useState(() => session.frameworkSource !== null);

  useEffect(
    function tryDetectFramework() {
      if (session.frameworkSource) return;

      const sessionId = session.sessionId;

      detectFramework(session.projectDir)
        .then(function handleDetection(fw) {
          if (isStaleSession(sessionId)) return;
          if (fw) store.setFramework(fw.id, 'detected');
        })
        .catch(() => {})
        .finally(() => {
          if (isStaleSession(sessionId)) return;
          setAttempted(true);
        });
    },
    [session.projectDir, session.frameworkSource, session.sessionId],
  );

  return attempted;
}
