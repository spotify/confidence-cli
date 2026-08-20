import { useState } from 'react';
import { ScreenId } from '@lib/session.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { useLogger } from '../../hooks/useLog.js';
import { useAutoAdvance } from '../../hooks/useAutoAdvance.js';
import { store } from '../../store.js';
import { track } from '@lib/telemetry.js';
import { skipped } from '../../lib/log-messages.js';
import { useInitialGoalSelection, type Phase } from './useInitialGoalSelection.js';
import { goalChosen } from './log-messages.js';
import * as te from './telemetry-events.js';
import { goalLabel, type GoalValue } from './actions.js';

export type GoalSelection = {
  phase: Phase;
  recordingAvailable: boolean;
  selectGoal: (value: GoalValue) => void;
};

export function useGoalSelection(): GoalSelection {
  const navigate = useNavigation(ScreenId.SelectGoal);
  const log = useLogger(ScreenId.SelectGoal);
  const initial = useInitialGoalSelection();

  const [phase] = useState<Phase>(initial.phase);

  useAutoAdvance({
    screen: ScreenId.SelectGoal,
    when: initial.phase === 'done',
    delay: 0,
    onAdvance: () => {
      store.setOnboardingGoal('feature-flags');
      log(goalChosen('feature-flags (auto — framework)'));
    },
  });

  function selectGoal(value: GoalValue) {
    if (value === 'skip') {
      track(te.goalSkipped());
      log(skipped());
      navigate.to('skip');
      return;
    }

    const goal = value;
    store.setOnboardingGoal(goal);
    track(te.goalSelected(goal));
    log(goalChosen(goalLabel(goal)));
    navigate.to('next');
  }

  return {
    phase,
    recordingAvailable: initial.supportsRecordings,
    selectGoal,
  };
}
