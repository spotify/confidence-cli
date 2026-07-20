import { Box, Text } from 'ink';
import { Colors, HAlign, VAlign } from '../../styles.js';
import { PromptPanel } from '../../components/PromptPanel.js';
import { SDK_OPTIONS } from '@lib/sdk-options.js';
import { ScreenId } from '@lib/session.js';
import { useIsNarrow } from '../../hooks/useIsNarrow.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { useSession, store } from '../../store.js';
import { useIsShort } from '../../hooks/useIsShort.js';
import { track } from '@lib/telemetry.js';
import { frameworkSelected } from './telemetry-events.js';

export function SelectFrameworkScreen() {
  const session = useSession();
  const navigate = useNavigation(ScreenId.SelectFramework);
  const narrow = useIsNarrow();
  const short = useIsShort();
  const align = narrow ? HAlign.Left : HAlign.Center;
  const current = session.framework;

  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="space-between">
      <Box flexDirection="column" alignItems={align} flexGrow={1} justifyContent={VAlign.Center}>
        <Box marginBottom={1}>
          <Text color={Colors.primary} bold>
            Select Framework
          </Text>
        </Box>
        {short ? (
          <Box marginBottom={1} flexDirection="column" alignItems={align}>
            <Text color={Colors.muted}>Choose your project's SDK.</Text>
          </Box>
        ) : (
          <Box marginBottom={1} flexDirection="column" alignItems={align}>
            <Text color={Colors.muted}>Choose your project's SDK. The wizard will:</Text>
            <Text color={Colors.muted}> 1. Install the matching Confidence SDK package</Text>
            <Text color={Colors.muted}> 2. Generate framework-specific integration code</Text>
            <Text color={Colors.muted}> 3. Guide you through a working feature flag example</Text>
          </Box>
        )}
        {current && (
          <Text>
            Currently: <Text bold>{current}</Text>
          </Text>
        )}
      </Box>

      <PromptPanel
        mode="select"
        status="Select your project's framework or language:"
        options={SDK_OPTIONS.map((sdk) => ({
          label: sdk.label,
          value: sdk.id,
        }))}
        onSelect={(value) => {
          const selected = SDK_OPTIONS.find((s) => s.id === value);
          if (selected) {
            track(frameworkSelected(value));
            store.setFramework(selected.id, 'selected');
          }
          navigate.back();
        }}
        onCancel={() => navigate.back()}
      />
    </Box>
  );
}
