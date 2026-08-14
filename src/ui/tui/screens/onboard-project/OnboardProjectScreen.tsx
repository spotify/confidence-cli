import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { Colors, Emoji, Icons } from '../../styles.js';
import { PromptPanel } from '../../components/PromptPanel.js';
import { TwoColumnLayout } from '../../components/TwoColumnLayout.js';
import { TaskList } from '../../components/TaskList.js';
import { StatusFeed } from '../../components/StatusFeed.js';
import { buildWizardTasks } from '../../lib/wizard-tasks.js';
import { SDK_OPTIONS } from '@lib/sdk-options.js';
import { useTipRotation } from '../../hooks/useTipRotation.js';
import { TipCard } from '../../components/TipCard.js';
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
import { CONFIRM_OPTIONS, ERROR_OPTIONS } from './actions.js';

const MAX_VISIBLE_STATUS = 3;
const DEFAULT_GOAL: OnboardingGoal = 'feature-flags';

const SANDBOX_WARNING = 'The AI agent will be able to read and write files in your project.';

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
      <TwoColumnLayout left={<LeftPanel />} right={<TaskList tasks={tasks} />} />
      <BottomPrompt />
    </Box>
  );

  function LeftPanel() {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color={Colors.primary} bold>
            {onboarding.phase === 'confirm' ? 'Ready to start?' : 'Setting up your project'}
          </Text>
        </Box>

        {onboarding.phase === 'confirm' && (
          <>
            <Box flexDirection="column" marginBottom={1}>
              <Text color={Colors.muted}>The wizard will:</Text>
              {onboardingSteps({
                goal: session.onboardingGoal ?? DEFAULT_GOAL,
                migrations: session.migrationTargets,
              }).map((step) => (
                <Text key={step} color={Colors.muted}>
                  {Icons.check} {step}
                </Text>
              ))}
            </Box>
            <Box marginBottom={1}>
              <Text color={Colors.warning}>
                {Icons.diamond} {SANDBOX_WARNING}
              </Text>
            </Box>
          </>
        )}

        {onboarding.phase === 'detecting' && <Spinner label="Detecting project framework..." />}

        {onboarding.phase === 'choose-sdk' && (
          <Box marginBottom={1} gap={1}>
            <Text color={Colors.warning}>{Icons.cross}</Text>
            <Text>Project appears to be empty. Choose an SDK to generate a sample app</Text>
          </Box>
        )}

        <StatusFeed lines={onboarding.statusLines} maxVisible={MAX_VISIBLE_STATUS} />

        {onboarding.phase === 'onboarding' && (
          <Box flexDirection="column" marginTop={1}>
            <Spinner label={`Working... Grab a coffee in the meantime ${Emoji.coffee}`} />
            {showTips && (
              <Box marginTop={1} flexDirection="column">
                <Text>While you wait, here's a tip:</Text>
                <TipCard tip={tip} />
              </Box>
            )}
          </Box>
        )}

        {onboarding.phase === 'error' && onboarding.error && (
          <Box marginTop={1}>
            <Text color={Colors.error}>{onboarding.error}</Text>
          </Box>
        )}
      </Box>
    );
  }

  function BottomPrompt() {
    switch (onboarding.phase) {
      case 'confirm':
        return (
          <PromptPanel
            mode="select"
            status="Start onboarding?"
            options={CONFIRM_OPTIONS}
            onSelect={(value) => {
              if (value === 'skip') return handleConfirmSkip();
              handleConfirmStart();
            }}
          />
        );
      case 'choose-sdk':
        return (
          <PromptPanel
            mode="select"
            status="Which SDK should we use for the sample app?"
            options={[
              ...SDK_OPTIONS.map((sdk) => ({ label: sdk.label, value: sdk.id })),
              { label: 'Skip', value: 'skip' },
            ]}
            onSelect={(value) => {
              if (value === 'skip') return handleSkip();
              const selected = SDK_OPTIONS.find((s) => s.id === value);
              if (selected) onboarding.selectSdk(selected.id, selected.label);
            }}
          />
        );
      case 'onboarding':
        return (
          <PromptPanel mode="info" status="This usually takes 3–5 min." onCancel={handleCancel} />
        );
      case 'error':
        return (
          <PromptPanel
            mode="select"
            status="Onboarding encountered an error."
            options={ERROR_OPTIONS}
            onSelect={(value) => (value === 'retry' ? handleRetry() : handleSkip())}
          />
        );
      case 'detecting':
      case 'done':
        return null;
      default: {
        const _exhaustive: never = onboarding.phase satisfies never;
        throw new Error(`Unhandled phase: ${_exhaustive}`);
      }
    }
  }
}

const GOAL_STEPS: Record<OnboardingGoal, string[]> = {
  'feature-flags': ['create your first feature flag'],
  'session-recordings': ['set up session recordings to capture user sessions'],
  all: ['set up feature flags', 'set up session recordings to capture user sessions'],
};

type SelectedChoices = {
  goal: OnboardingGoal;
  migrations: Array<{ name: string }>;
};

function onboardingSteps({ goal, migrations }: SelectedChoices): string[] {
  return [
    'add the Confidence SDK',
    ...GOAL_STEPS[goal],
    ...migrations.map((t) => `migrate ${t.name} feature flags to Confidence`),
  ];
}
