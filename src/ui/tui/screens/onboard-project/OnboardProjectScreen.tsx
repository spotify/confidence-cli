import { Box } from 'ink';
import { MainLayout } from '../../components/MainLayout.js';
import { TaskList } from '../../components/TaskList.js';
import { buildWizardTasks } from '../../lib/wizard-tasks.js';
import { useTipRotation } from '../../hooks/useTipRotation.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { tipsFitInViewport } from '../../lib/layout-budget.js';
import { ScreenId, type OnboardingGoal } from '@lib/session.js';
import { useAutoAdvance } from '../../hooks/useAutoAdvance.js';
import { useLogger } from '../../hooks/useLog.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { skipped } from '../../lib/log-messages.js';
import { $session, useSession } from '../../store.js';
import { useOnboardingProcess } from './useOnboardingProcess.js';
import { track } from '@lib/telemetry.js';
import { onboardingCancelled, onboardingCompleted } from './log-messages.js';
import * as te from './telemetry-events.js';
import {
  OnboardingLeftPanel,
  OnboardingBottomPrompt,
  MAX_VISIBLE_STATUS,
} from './components/index.js';

const DEFAULT_GOAL: OnboardingGoal = 'feature-flags';

export function OnboardProjectScreen() {
  const session = useSession();
  const navigate = useNavigation(ScreenId.OnboardProject);
  const log = useLogger(ScreenId.OnboardProject);
  const { rows, columns } = useTerminalSize();
  const onboarding = useOnboardingProcess();
  const showTips = tipsFitInViewport(rows, columns, MAX_VISIBLE_STATUS + 1);
  const tip = useTipRotation(onboarding.phase === 'onboarding');

  useAutoAdvance({
    screen: ScreenId.OnboardProject,
    when: onboarding.phase === 'done',
    delay: 2000,
    onAdvance() {
      log(onboardingCompleted(onboarding.frameworkName, $session.get().codeChanges));
      track(te.onboardingCompleted());
    },
  });

  function handleCancel() {
    track(te.onboardingCancelled());
    onboarding.cancel();
    log(onboardingCancelled());
    navigate.to('next');
  }

  function handleSkip() {
    track(te.onboardingSkipped());
    log(skipped());
    navigate.to('next');
  }

  function handleRetry() {
    track(te.onboardingRetried());
    onboarding.retry();
  }

  function handleConfirmSkip() {
    track(te.onboardingConfirmSkipped());
    log(skipped());
    navigate.to('skip');
  }

  function handleConfirmStart() {
    track(te.onboardingConfirmed('started'));
    onboarding.confirmStart();
  }

  const tasks = buildWizardTasks(
    'onboardProject',
    onboarding.phase === 'done' ? 'done' : onboarding.phase === 'error' ? 'error' : 'active',
  );

  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="space-between">
      <MainLayout
        main={
          <OnboardingLeftPanel
            phase={onboarding.phase}
            statusLines={onboarding.statusLines}
            error={onboarding.error}
            goal={session.onboardingGoal ?? DEFAULT_GOAL}
            migrations={session.migrationTargets}
            showTips={showTips}
            tip={tip}
          />
        }
        aside={<TaskList tasks={tasks} />}
      />
      <OnboardingBottomPrompt
        phase={onboarding.phase}
        selectSdk={onboarding.selectSdk}
        onConfirmStart={handleConfirmStart}
        onConfirmSkip={handleConfirmSkip}
        onSkip={handleSkip}
        onRetry={handleRetry}
        onCancel={handleCancel}
      />
    </Box>
  );
}
