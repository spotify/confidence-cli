import { useCallback, useRef, useState } from 'react';
import { type ChildProcess } from 'node:child_process';
import { buildOnboardingPrompt } from '@lib/onboarding-prompt/index.js';
import { detectFramework } from '@frameworks/index.js';
import { ScreenId, type OnboardingGoal } from '@lib/session.js';
import { type IdeId, getIntegration, normalizeStatusLine } from '@integrations/index.js';
import type { DetectedProvider } from '@providers/types.js';
import { useLogger } from '../../hooks/useLog.js';
import { $session, store, isStaleSession } from '../../store.js';
import { useInitialOnboarding } from './useInitialOnboarding.js';

import type { StatusLine } from '../../lib/status-line.js';
import { track } from '@lib/telemetry.js';
import {
  onboardingDryRun,
  onboardingExitError,
  onboardingExitSuccess,
  onboardingSpawnError,
  onboardingStarted,
  onboardingStderr,
  onboardingStdout,
} from './log-messages.js';
import { onboardingFailed } from './telemetry-events.js';

export type OnboardingPhase =
  'confirm' | 'detecting' | 'choose-sdk' | 'onboarding' | 'done' | 'error';

export type OnboardingProcess = {
  phase: OnboardingPhase;
  frameworkName: string | null;
  statusLines: StatusLine[];
  error: string | null;
  confirmStart: () => void;
  confirmStartWithMigration: (providers: DetectedProvider[]) => void;
  selectSdk: (id: string, label: string) => void;
  cancel: () => void;
  retry: () => void;
};

export function useOnboardingProcess(): OnboardingProcess {
  const log = useLogger(ScreenId.OnboardProject);
  const initial = useInitialOnboarding();
  const [phase, setPhase] = useState<OnboardingPhase>(initial.phase);
  const [statusLines, setStatusLines] = useState<StatusLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [frameworkName, setFrameworkName] = useState<string | null>(initial.frameworkName);
  const childRef = useRef<ChildProcess | null>(null);

  const addStatus = useCallback(function addStatus(
    text: string,
    type: StatusLine['type'] = 'info',
  ) {
    setStatusLines((prev) => [...prev, { text, type }]);
    store.setOnboardingStatus(text);
  }, []);

  const markComplete = useCallback(
    function markComplete(goal: OnboardingGoal, lines?: string[]) {
      addStatus('', 'blank');
      addStatus('Project onboarding complete!', 'success');
      store.setReportFile('CONFIDENCE_QUICKSTART.md');
      store.setCodeChanges(
        lines
          ? lines
              .filter(
                (line) =>
                  line.includes('Created') || line.includes('Modified') || line.includes('Added'),
              )
              .map(normalizeStatusLine)
          : dryRunCodeChanges(goal),
      );
      setPhase('done');
    },
    [addStatus],
  );

  const start = useCallback(
    function start(fwName: string | null) {
      const s = $session.get();
      const isEmpty = s.isEmptyProject;
      const goal = s.onboardingGoal ?? 'feature-flags';
      const fw = fwName ?? 'React';
      setPhase('onboarding');
      addStatus(isEmpty ? 'Scaffolding sample app...' : 'Setting up Confidence...');

      if (s.dryRun) return startDryRun();
      startReal();

      function startDryRun() {
        log(onboardingDryRun(fw));
        const steps = buildDryRunSteps(fw, isEmpty, goal, s.migrationTargets);

        let i = 0;
        const interval = setInterval(() => {
          if (i < steps.length) {
            addStatus(steps[i], 'info');
            log(onboardingStdout(steps[i]));
            i++;
          } else {
            clearInterval(interval);
            markComplete(goal);
          }
        }, 3000);
      }

      function startReal() {
        if (!isEmpty) addStatus(`Framework: ${fw}`);

        addStatus(
          isEmpty
            ? 'Scaffolding sample app and integrating Confidence SDK...'
            : 'Analyzing project...',
        );

        const targets = s.migrationTargets;
        const ide = (s.ide ?? 'claude') as IdeId;
        const prompt = buildOnboardingPrompt({
          framework: fw,
          projectDir: s.projectDir,
          ide,
          isEmptyProject: isEmpty,
          goal,
          migrations:
            targets.length > 0
              ? targets.map((t) => ({ providerName: t.name, skillName: t.skillName }))
              : undefined,
          hasPlugins: s.installedPlugins.length > 0,
        });

        log(onboardingStarted(fw, prompt));
        const integration = getIntegration(ide);

        const child = integration.runOnboarding(
          { prompt, projectDir: s.projectDir, token: s.authState.token },
          {
            onStatus(text) {
              addStatus(text, 'info');
            },
            onStdout(line) {
              log(onboardingStdout(line));
            },
            onStderr(text) {
              log(onboardingStderr(text));
            },
            onComplete(lines) {
              childRef.current = null;
              log(onboardingExitSuccess(lines.length));
              markComplete(goal, lines);
            },
            onError(message) {
              childRef.current = null;
              setError(message);
              addStatus(`Error: ${message}`, 'error');
              log(
                !message.startsWith('Process exited')
                  ? onboardingSpawnError(message)
                  : onboardingExitError(null, message),
              );
              track(onboardingFailed());
              setPhase('error');
            },
          },
        );

        childRef.current = child;
      }
    },
    [log, addStatus, markComplete],
  );

  function beginOnboarding(providers: DetectedProvider[] = []) {
    store.setMigrationTargets(providers);
    store.setOnboardingGoal('feature-flags');

    if (initial.needsSdkSelection) {
      store.setEmptyProject(true);
      setPhase('choose-sdk');
      return;
    }

    setPhase('detecting');
    const session = $session.get();

    if (session.dryRun || session.framework) {
      start(initial.frameworkName ?? session.framework);
      return;
    }

    const sessionId = session.sessionId;

    detectFramework(session.projectDir)
      .then(function handleDetection(fw) {
        if (isStaleSession(sessionId)) return;
        if (fw) {
          setFrameworkName(fw.name);
          store.setFramework(fw.id);
        }
        start(fw?.name ?? initial.frameworkName);
      })
      .catch(() => {});
  }

  function selectSdk(id: string, label: string) {
    setFrameworkName(label);
    store.setFramework(id, 'selected');
    start(label);
  }

  function cancel() {
    if (childRef.current) {
      childRef.current.kill();
      childRef.current = null;
    }
  }

  function retry() {
    setStatusLines([]);
    setError(null);
    start(frameworkName);
  }

  return {
    phase,
    frameworkName,
    statusLines,
    error,
    confirmStart: beginOnboarding,
    confirmStartWithMigration: beginOnboarding,
    selectSdk,
    cancel,
    retry,
  };
}

function buildDryRunSteps(
  fw: string,
  isEmpty: boolean,
  goal: OnboardingGoal,
  targets: DetectedProvider[],
): string[] {
  const detect = isEmpty ? ['Scaffolding sample app...'] : [`Detected framework: ${fw}`];
  const flagSteps = [
    'Determining appropriate SDK...',
    'Installing @spotify-confidence/sdk...',
    'Generating Confidence configuration...',
    'Creating feature flag example...',
  ];
  const recordingSteps = [
    'Installing session recording SDK...',
    'Adding session recording provider...',
    'Configuring privacy settings...',
  ];
  const migrationSteps = targets.flatMap((t) => [
    `Migrating ${t.name} flags to Confidence...`,
    `Removed ${t.name} SDK dependency`,
  ]);

  const goalSteps =
    goal === 'feature-flags'
      ? flagSteps
      : goal === 'session-recording'
        ? recordingSteps
        : [...flagSteps, ...recordingSteps];

  return [
    ...detect,
    ...goalSteps,
    ...migrationSteps,
    'Generating CONFIDENCE_QUICKSTART.md report...',
  ];
}

function dryRunCodeChanges(goal: OnboardingGoal): string[] {
  const flagChanges = [
    'Added @spotify-confidence/sdk dependency',
    'Created confidence.config.ts',
    'Added feature flag example',
  ];
  const recordingChanges = [
    'Added @spotify-confidence/session-recording dependency',
    'Added session recording provider',
  ];

  if (goal === 'feature-flags') return flagChanges;
  if (goal === 'session-recording') return recordingChanges;
  return [...flagChanges, ...recordingChanges];
}
