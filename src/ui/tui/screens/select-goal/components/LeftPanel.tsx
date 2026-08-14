import { Box, Text } from 'ink';
import { Colors, Icons } from '../../../styles.js';
import type { GoalSelection } from '../useGoalSelection.js';
import { formatProviderNames } from '../utils.js';

type GoalSelectionProps = {
  goalSelection: GoalSelection;
};

export function LeftPanel({ goalSelection }: GoalSelectionProps) {
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
            Found {formatProviderNames(goalSelection.detectedProviders)} in your project. Would you
            like to migrate their flags to Confidence?
          </Text>
        </Box>
      )}
    </Box>
  );
}
