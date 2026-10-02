import type { OnboardingGoal } from '@spotify-confidence/shared-kernel';
import { ScreenId, BROWSER_PLATFORMS, track } from '@spotify-confidence/core';
import { useNavigation } from '../../hooks/useNavigation.js';
import { useAutoAdvance } from '../../hooks/useAutoAdvance.js';
import { useLogger } from '../../hooks/useLog.js';
import { store, useSession } from '../../store.js';
import { goalLabel } from './actions.js';
import { goalsChosen, recordingsIncompatible } from './log-messages.js';
import * as te from './telemetry-events.js';

export type GoalSelection = {
  recordingAvailable: boolean;
  incompatiblePreset: boolean;
  submitGoals: (values: OnboardingGoal[]) => void;
  continueWithoutRecordings: () => void;
};

export function useGoalSelection(): GoalSelection {
  const session = useSession();
  const navigate = useNavigation(ScreenId.SelectGoal);
  const log = useLogger(ScreenId.SelectGoal);

  const recordingAvailable = !!session.framework && BROWSER_PLATFORMS.has(session.framework);

  const goalsPreset =
    session.onboardingGoals.length > 0 && !session.completedScreens.has(ScreenId.SelectGoal);

  const hasPresetRecordings = goalsPreset && session.onboardingGoals.includes('session-recordings');

  const incompatiblePreset = hasPresetRecordings && !recordingAvailable;

  useAutoAdvance({
    screen: ScreenId.SelectGoal,
    when: goalsPreset && !incompatiblePreset,
    delay: 0,
    onAdvance() {
      const goals = session.onboardingGoals;
      track(te.goalsSelected(goals));
      log(goalsChosen(goals.map(goalLabel).join(', ')));
    },
  });

  function submitGoals(values: OnboardingGoal[]) {
    if (values.length === 0) return;

    store.setOnboardingGoals(values);
    track(te.goalsSelected(values));
    log(goalsChosen(values.map(goalLabel).join(', ')));
    navigate.to('next');
  }

  function continueWithoutRecordings() {
    const compatible = session.onboardingGoals.filter((g) => g !== 'session-recordings');
    log(recordingsIncompatible(session.framework ?? 'unknown'));
    track(te.recordingsIncompatibleContinued(session.framework ?? 'unknown'));

    if (compatible.length > 0) {
      store.setOnboardingGoals(compatible);
      track(te.goalsSelected(compatible));
      log(goalsChosen(compatible.map(goalLabel).join(', ')));
      navigate.to('next');
    }
  }

  return {
    recordingAvailable,
    incompatiblePreset,
    submitGoals,
    continueWithoutRecordings,
  };
}
