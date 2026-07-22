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
import { ScreenId } from '@lib/session.js';
import type { DetectedProvider } from '@providers/types.js';
import { useAutoAdvance } from '../../hooks/useAutoAdvance.js';
import { useLogger } from '../../hooks/useLog.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { skipped } from '../../lib/log-messages.js';
import { useSession, $session } from '../../store.js';
import { useOnboardingProcess } from './useOnboardingProcess.js';
import { goalLabel } from '../../lib/onboarding-goal.js';
import { track } from '@lib/telemetry.js';
import { onboardingCancelled, onboardingCompleted } from './log-messages.js';
import * as te from './telemetry-events.js';

const MAX_VISIBLE_STATUS = 3;

const CONFIRM_DESCRIPTION =
  'The wizard will add the Confidence SDK and create your first feature flag.';

const SANDBOX_WARNING = 'The AI agent will be able to read and write files in your project.';

export function OnboardProjectScreen() {
  const session = useSession();
  const navigate = useNavigation(ScreenId.OnboardProject);
  const log = useLogger(ScreenId.OnboardProject);
  const { rows, columns } = useTerminalSize();
  const onboarding = useOnboardingProcess();
  const showTips = tipsFitInViewport(rows, columns, MAX_VISIBLE_STATUS + 1);
  const tip = useTipRotation(onboarding.phase === 'onboarding');

  const goal = session.onboardingGoal ?? 'feature-flags';

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

  function handleConfirmMigrate(providers: DetectedProvider[], value: string) {
    if (value === 'migrate-all') {
      track(te.onboardingConfirmed('migrate-all'));
      onboarding.confirmStartWithMigration(providers);
      return;
    }

    const id = value.slice('migrate-'.length);
    const provider = providers.find((c) => c.id === id);
    if (provider) {
      track(te.onboardingConfirmed(`migrate-${id}`));
      onboarding.confirmStartWithMigration([provider]);
    }
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
            {onboarding.phase === 'confirm' ? 'Set up your project' : goalLabel(goal)}
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text color={Colors.muted}>{CONFIRM_DESCRIPTION}</Text>
        </Box>

        {onboarding.phase === 'confirm' && (
          <Box marginBottom={1}>
            <Text color={Colors.warning}>
              {Icons.diamond} {SANDBOX_WARNING}
            </Text>
          </Box>
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
        return <ConfirmPrompt />;
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
            options={[
              { label: 'Retry', value: 'retry' },
              { label: 'Skip', value: 'skip' },
            ]}
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

  function ConfirmPrompt() {
    const providers = session.detectedProviders;
    const showMigration = providers.length > 0 && session.installedPlugins.length > 0;

    return (
      <PromptPanel
        mode="select"
        status={
          showMigration
            ? `Found ${formatNames(providers)} in code. How would you like to proceed?`
            : 'Start onboarding?'
        }
        options={showMigration ? migrationOptions(providers) : standardOptions()}
        onSelect={(value) => {
          if (value === 'skip') return handleConfirmSkip();
          if (value.startsWith('migrate-')) return handleConfirmMigrate(providers, value);
          handleConfirmStart();
        }}
      />
    );
  }
}

function standardOptions() {
  return [
    { label: 'Start onboarding', value: 'start' },
    { label: 'Skip for now', value: 'skip' },
  ];
}

function migrationOptions(providers: DetectedProvider[]) {
  return [
    { label: 'Just integrate Confidence', value: 'start' },

    ...(providers.length > 1
      ? [{ label: 'Integrate and migrate all existing flags', value: 'migrate-all' }]
      : []),

    ...providers.map((c) => ({
      label: `Integrate and migrate ${c.name}'s flags`,
      value: `migrate-${c.id}`,
    })),

    { label: 'Skip for now', value: 'skip' },
  ];
}

function formatNames(providers: DetectedProvider[]): string {
  const names = providers.map((c) => c.name);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}
