import { useState } from 'react';
import { ScreenId } from '@lib/session.js';
import type { DetectedProvider } from '@providers/types.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { useLogger } from '../../hooks/useLog.js';
import { useAutoAdvance } from '../../hooks/useAutoAdvance.js';
import { useSession, store } from '../../store.js';
import { track } from '@lib/telemetry.js';
import { skipped } from '../../lib/log-messages.js';
import {
  useInitialGoalSelection,
  canOfferMigration,
  type Phase,
} from './useInitialGoalSelection.js';
import { goalChosen, migrationChosen } from './log-messages.js';
import * as te from './telemetry-events.js';
import { goalLabel, type GoalValue, type MigrationValue } from './actions.js';

export type GoalSelection = {
  phase: Phase;
  detectedProviders: DetectedProvider[];
  recordingAvailable: boolean;
  selectGoal: (value: GoalValue) => void;
  selectMigration: (value: MigrationValue) => void;
};

export function useGoalSelection(): GoalSelection {
  const session = useSession();
  const navigate = useNavigation(ScreenId.SelectGoal);
  const log = useLogger(ScreenId.SelectGoal);
  const initial = useInitialGoalSelection();

  const [phase, setPhase] = useState<Phase>(initial.phase);

  useAutoAdvance({
    screen: ScreenId.SelectGoal,
    when: initial.phase === 'done',
    delay: 0,
    onAdvance: () => {
      store.setOnboardingGoal('feature-flags');
      store.setMigrationTargets([]);
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

    const shouldOfferMigration =
      ['feature-flags', 'all'].includes(goal) &&
      canOfferMigration(initial.providers, session.installedPlugins);

    if (shouldOfferMigration) {
      setPhase('select-migration');
    } else {
      store.setMigrationTargets([]);
      navigate.to('next');
    }
  }

  function selectMigration(value: MigrationValue) {
    if (value === 'skip') {
      store.setMigrationTargets([]);
      log(migrationChosen([]));
      track(te.migrationSelected('skip'));
      return navigate.to('next');
    }

    if (value === 'migrate-all') {
      store.setMigrationTargets(initial.providers);
      log(migrationChosen(initial.providers.map((p) => p.name)));
      track(te.migrationSelected('migrate-all'));
      return navigate.to('next');
    }

    const id = value.slice('migrate-'.length);
    const provider = initial.providers.find((p) => p.id === id);
    if (provider) {
      store.setMigrationTargets([provider]);
      log(migrationChosen([provider.name]));
      track(te.migrationSelected(`migrate-${id}`));
    }

    navigate.to('next');
  }

  return {
    phase,
    detectedProviders: initial.providers,
    recordingAvailable: initial.supportsRecordings,
    selectGoal,
    selectMigration,
  };
}
