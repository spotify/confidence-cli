import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';
import type { IdeId, OnboardingGoal, DetectedProvider } from '@spotify-confidence/shared-kernel';
import {
  type WizardSession,
  type CheckResult,
  type AuthState,
  type DebugEntry,
  type FrameworkSource,
  ScreenId,
  createSession,
} from '@spotify-confidence/core';
import { readSavedIde } from './lib/ide-config.js';

export type StoreOptions = {
  dryRun?: boolean;
  debug?: boolean;
  dir?: string;
  goals?: OnboardingGoal[];
};

export const $session = atom<WizardSession>(createSession());

export function isStaleSession(sessionId: string): boolean {
  return $session.get().sessionId !== sessionId;
}

function updateSession(partial: Partial<WizardSession>): void {
  $session.set({ ...$session.get(), ...partial });
}

export const store = {
  init: (opts?: StoreOptions): void =>
    $session.set(
      createSession({
        dryRun: opts?.dryRun,
        debug: opts?.debug,
        dir: opts?.dir,
        goals: opts?.goals,
        ide: opts?.dryRun ? null : readSavedIde(),
      }),
    ),

  navigateTo: (screen: ScreenId): void =>
    updateSession({
      currentScreen: screen,
    }),

  addDebugEntry: (entry: DebugEntry): void =>
    updateSession({
      debugLog: [...$session.get().debugLog, entry],
    }),

  completeScreen: (screen: ScreenId): void => {
    const completed = new Set<ScreenId>($session.get().completedScreens);
    completed.add(screen);
    updateSession({ completedScreens: completed });
  },

  setFramework: (framework: string, source: FrameworkSource = 'detected'): void =>
    updateSession({
      framework,
      frameworkSource: source,
    }),

  setSystemCheck: (name: string, result: CheckResult): void =>
    updateSession({
      systemChecks: {
        ...$session.get().systemChecks,
        [name]: result,
      },
    }),

  setAuthState: (authState: AuthState): void =>
    updateSession({
      authState,
    }),

  setIde: (ide: IdeId): void =>
    updateSession({
      ide,
    }),

  setPluginTargets: (plugins: IdeId[]): void =>
    updateSession({
      pluginTargets: plugins,
    }),

  setConnectedMcps: (mcps: string[]): void =>
    updateSession({
      connectedMcps: mcps,
    }),

  setEmptyProject: (isEmpty: boolean): void =>
    updateSession({
      isEmptyProject: isEmpty,
    }),

  setDetectedProviders: (providers: DetectedProvider[]): void =>
    updateSession({
      detectedProviders: providers,
    }),

  setOnboardingGoals: (goals: OnboardingGoal[]): void =>
    updateSession({
      onboardingGoals: goals,
    }),

  setOnboardingStatus: (status: string): void =>
    updateSession({
      onboardingStatus: status,
    }),

  setReportFile: (path: string): void =>
    updateSession({
      reportFile: path,
    }),

  setCodeChanges: (changes: string[]): void =>
    updateSession({
      codeChanges: changes,
    }),
};

export const useSession = (): WizardSession => useStore($session);
