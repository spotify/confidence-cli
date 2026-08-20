import { Box, Text } from 'ink';
import { Colors, Icons } from '../../../styles.js';
import type { GoalSelection } from '../useGoalSelection.js';

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
            : 'Set up your project'}
        </Text>
      </Box>

      {goalSelection.phase === 'select-goal' && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={Colors.muted}>
            Choose the Confidence features to integrate with your project.
          </Text>
          <Box marginTop={1}>
            <Text color={Colors.warning}>
              {Icons.star} Event Tracking works best with a managed warehouse or an existing
              warehouse setup.
            </Text>
          </Box>
          {goalSelection.recordingAvailable && (
            <Box marginTop={1}>
              <Text color={Colors.warning}>
                {Icons.star} Session Recordings (β) require the feature to be enabled on your
                Confidence account.
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
