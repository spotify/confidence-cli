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
          Select the features you'd like to set up
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text color={Colors.muted}>Toggle Confidence features to integrate with your project.</Text>
        <Box marginTop={1}>
          <Text color={Colors.warning}>
            {Icons.diamond} Event Tracking works best with a managed warehouse or an existing
            warehouse setup.
          </Text>
        </Box>
        {goalSelection.recordingAvailable && (
          <Box marginTop={1}>
            <Text color={Colors.warning}>
              {Icons.diamond} Session Recordings (β) require the feature to be enabled on your
              Confidence account.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
