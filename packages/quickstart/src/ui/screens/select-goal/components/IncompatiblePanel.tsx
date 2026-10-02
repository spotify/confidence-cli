import { Box, Text } from 'ink';
import { useSession } from '../../../store.js';
import { Colors, Icons } from '../../../styles.js';

export function IncompatiblePanel() {
  const session = useSession();

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={Colors.error} bold>
          Incompatible feature selection
        </Text>
      </Box>
      <Box flexDirection="column" marginBottom={1}>
        <Text>
          Session recordings require a browser SDK (React, TypeScript, or JavaScript), but your
          project uses <Text bold>{session.framework ?? 'an unsupported SDK'}</Text>.
        </Text>
        <Box marginTop={1}>
          <Text color={Colors.muted}>
            {Icons.diamond} Re-run without <Text bold>--features recordings</Text>, or select a
            browser SDK on the welcome screen.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
