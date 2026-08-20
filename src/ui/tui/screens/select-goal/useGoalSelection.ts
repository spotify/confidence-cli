import type { OnboardingGoal } from '@lib/session.js';
import { ScreenId } from '@lib/session.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { useLogger } from '../../hooks/useLog.js';
import { store } from '../../store.js';
import { track } from '@lib/telemetry.js';
import { skipped } from '../../lib/log-messages.js';
import { useInitialGoalSelection, type Phase } from './useInitialGoalSelection.js';
import { goalsChosen } from './log-messages.js';
import * as te from './telemetry-events.js';
import { goalLabel } from './actions.js';

export type GoalSelection = {
  phase: Phase;
  recordingAvailable: boolean;
  submitGoals: (values: OnboardingGoal[]) => void;
};

export function useGoalSelection(): GoalSelection {
  const navigate = useNavigation(ScreenId.SelectGoal);
  const log = useLogger(ScreenId.SelectGoal);
  const initial = useInitialGoalSelection();

  function submitGoals(values: OnboardingGoal[]) {
    if (values.length === 0) {
      track(te.goalSkipped());
      log(skipped());
      navigate.to('skip');
      return;
    }

    store.setOnboardingGoals(values);
    track(te.goalsSelected(values));
    log(goalsChosen(values.map(goalLabel).join(', ')));
    navigate.to('next');
  }

  return {
    phase: initial.phase,
    recordingAvailable: initial.supportsRecordings,
    submitGoals,
  };
}
