import { Box, Text } from 'ink';
import { Colors, HAlign, VAlign } from '../../styles.js';
import { PromptPanel } from '../../components/PromptPanel.js';
import { CONFIDENCE_DOCS_URL, CONFIDENCE_DASHBOARD_URL } from '@lib/constants.js';
import { ScreenId } from '@lib/session.js';
import { useIsNarrow } from '../../hooks/useIsNarrow.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { track } from '@lib/telemetry.js';
import { aboutBack } from './telemetry-events.js';

export function AboutScreen() {
  const navigate = useNavigation(ScreenId.About);
  const narrow = useIsNarrow();
  const align = narrow ? HAlign.Left : HAlign.Center;

  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="space-between">
      <Box flexDirection="column" alignItems={align} flexGrow={1} justifyContent={VAlign.Center}>
        <Box marginBottom={1}>
          <Text color={Colors.primary} bold>
            About Confidence
          </Text>
        </Box>

        <Box marginBottom={1} flexDirection="column" alignItems={align}>
          <Text>Confidence is Spotify's feature flagging and experimentation platform.</Text>
          <Text>Run experiments in your data warehouse — BigQuery, Snowflake,</Text>
          <Text>Redshift, Databricks. Your data stays under your control.</Text>
          <Text>OpenFeature-compliant SDKs mean no vendor lock-in.</Text>
        </Box>

        <Box flexDirection="column" marginTop={1}>
          <Text>
            <Text color={Colors.muted}>{'     Docs: '}</Text>
            <Text color={Colors.primary}>{CONFIDENCE_DOCS_URL}</Text>
          </Text>
          <Text>
            <Text color={Colors.muted}>{'Dashboard: '}</Text>
            <Text color={Colors.primary}>{CONFIDENCE_DASHBOARD_URL}</Text>
          </Text>
        </Box>
      </Box>

      <PromptPanel
        mode="select"
        status="Back to setup?"
        options={[{ label: 'Back', value: 'back' }]}
        onSelect={() => {
          track(aboutBack());
          navigate.back();
        }}
        onCancel={() => navigate.back()}
      />
    </Box>
  );
}
