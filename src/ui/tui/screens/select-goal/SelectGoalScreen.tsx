import { Box, Text } from 'ink';
import { Colors, Icons } from '../../styles.js';
import { PromptPanel, type PromptOption } from '../../components/PromptPanel.js';
import { TwoColumnLayout } from '../../components/TwoColumnLayout.js';
import { TaskList } from '../../components/TaskList.js';
import { buildWizardTasks } from '../../lib/wizard-tasks.js';
import type { DetectedProvider } from '@providers/types.js';
import { useGoalSelection, goalOptionsFor } from './useGoalSelection.js';

const WIZARD_TASKS = buildWizardTasks('onboardProject', 'active');

export function SelectGoalScreen() {
  const goalSelection = useGoalSelection();

  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="space-between">
      <TwoColumnLayout left={<LeftPanel />} right={<TaskList tasks={WIZARD_TASKS} />} />
      <BottomPrompt />
    </Box>
  );

  function LeftPanel() {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color={Colors.primary} bold>
            {goalSelection.phase === 'select-goal'
              ? 'Which features would you like to set up?'
              : goalSelection.phase === 'select-migration'
                ? 'Migrate existing flags?'
                : 'Set up your project'}
          </Text>
        </Box>

        {goalSelection.phase === 'select-goal' && (
          <Box flexDirection="column" marginBottom={1}>
            <Text color={Colors.muted}>
              Choose the Confidence features to integrate with your project.
            </Text>
            {goalSelection.recordingAvailable && (
              <Box marginTop={1}>
                <Text color={Colors.warning}>
                  {Icons.diamond} Session Recordings (β) require the feature to be enabled on your
                  Confidence account.
                </Text>
              </Box>
            )}
          </Box>
        )}

        {goalSelection.phase === 'select-migration' && (
          <Box marginBottom={1}>
            <Text color={Colors.muted}>
              Found {formatProviderNames(goalSelection.detectedProviders)} in your project. Would
              you like to migrate their flags to Confidence?
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  function BottomPrompt() {
    switch (goalSelection.phase) {
      case 'select-goal':
        return (
          <PromptPanel
            mode="select"
            status="Select features to set up:"
            options={goalOptionsFor(goalSelection.recordingAvailable)}
            onSelect={goalSelection.selectGoal}
          />
        );
      case 'select-migration':
        return (
          <PromptPanel
            mode="select"
            status={`Found ${formatProviderNames(goalSelection.detectedProviders)} flags in code. How would you like to proceed?`}
            options={migrationOptions(goalSelection.detectedProviders)}
            onSelect={goalSelection.selectMigration}
          />
        );
      case 'done':
        return null;
      default: {
        const _exhaustive: never = goalSelection.phase satisfies never;
        throw new Error(`Unhandled phase: ${_exhaustive}`);
      }
    }
  }
}

function migrationOptions(providers: DetectedProvider[]): PromptOption[] {
  return [
    { label: 'Just integrate Confidence', value: 'skip' },

    ...(providers.length > 1
      ? [{ label: 'Integrate and migrate all existing flags', value: 'migrate-all' }]
      : []),

    ...providers.map((p) => ({
      label: `Integrate and migrate ${p.name}'s flags`,
      value: `migrate-${p.id}`,
    })),
  ];
}

function formatProviderNames(providers: DetectedProvider[]): string {
  const names = providers.map((p) => p.name);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}
