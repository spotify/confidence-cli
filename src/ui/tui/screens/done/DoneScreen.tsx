import { join } from 'node:path';
import { Box, Text, useApp } from 'ink';
import { Colors, HAlign, Icons, VAlign } from '../../styles.js';
import { PromptPanel } from '../../components/PromptPanel.js';
import { CONFIDENCE_DASHBOARD_URL, CONFIDENCE_DOCS_URL } from '@lib/constants.js';
import { TerminalLink } from '../../components/TerminalLink.js';
import { useIsNarrow } from '../../hooks/useIsNarrow.js';
import { launchChatSession } from '@integrations/index.js';
import { useSession, $session } from '../../store.js';
import { track } from '@lib/telemetry.js';
import { doneActionSelected } from './telemetry-events.js';

const MAX_SHOWN_CHANGES = 5;

export function DoneScreen() {
  const session = useSession();
  const { exit } = useApp();
  const narrow = useIsNarrow();
  const { reportFile, codeChanges, projectDir } = session;
  const align = narrow ? HAlign.Left : HAlign.Center;

  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="space-between">
      <Box flexDirection="column" alignItems={align} flexGrow={1} justifyContent={VAlign.Center}>
        <Box marginBottom={1}>
          <Text color={Colors.success} bold>
            {Icons.check} Confidence is ready!
          </Text>
        </Box>

        {codeChanges.length > 0 && (
          <Box flexDirection="column" marginBottom={1} alignItems={align}>
            <Box>
              <Text bold>What we set up:</Text>
            </Box>
            {codeChanges
              .toReversed()
              .slice(0, MAX_SHOWN_CHANGES)
              .map((change, i) => (
                <Box key={i} gap={1}>
                  <Text color={Colors.success}>{Icons.bullet}</Text>
                  <Text>{change}</Text>
                </Box>
              ))}
          </Box>
        )}

        {reportFile && (
          <Box flexDirection="column" marginBottom={1} alignItems={align}>
            <Text>Full details:</Text>
            <Box gap={1}>
              <Text color={Colors.success}>{Icons.bullet}</Text>
              <TerminalLink url={`file://${join(projectDir, reportFile)}`}>
                {reportFile}
              </TerminalLink>
            </Box>
          </Box>
        )}

        <Box flexDirection="column" alignItems={align}>
          <Text color={Colors.muted}>
            {'Docs: '}
            <Text color={Colors.primary}>{CONFIDENCE_DOCS_URL}</Text>
          </Text>
          <Text color={Colors.muted}>
            {'Dashboard: '}
            <Text color={Colors.primary}>{CONFIDENCE_DASHBOARD_URL}</Text>
          </Text>
        </Box>
      </Box>

      <PromptPanel
        mode="select"
        status="What's next?"
        options={[
          {
            label: codeChanges.length > 0 ? 'Ask about the changes' : 'Chat about Confidence',
            value: 'chat',
          },
          { label: 'Exit', value: 'exit' },
        ]}
        onSelect={(value) => {
          track(doneActionSelected(value));
          if (value === 'chat') {
            const s = $session.get();
            launchChatSession(s, s.ide ?? 'claude');
            exit();
          } else {
            exit();
          }
        }}
        onCancel={() => exit()}
      />
    </Box>
  );
}
