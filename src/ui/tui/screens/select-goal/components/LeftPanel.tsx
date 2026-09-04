import { Box, Text } from 'ink';
import { Colors, Icons } from '../../../styles.js';

export function LeftPanel() {
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
      </Box>
    </Box>
  );
}
