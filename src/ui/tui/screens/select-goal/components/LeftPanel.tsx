import { Box, Text } from 'ink';
import { Colors, Icons } from '../../../styles.js';
import { wizardStepLabel } from '../../../lib/wizard-tasks.js';

export function LeftPanel() {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={Colors.primary} bold>
          {wizardStepLabel('selectGoal')}
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text color={Colors.muted}>Toggle Confidence features to integrate with your project.</Text>
        <Box marginTop={1}>
          <Text color={Colors.warning}>
            {Icons.diamond} Event Tracking works best with Confidence Cloud or an existing warehouse
            setup.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
