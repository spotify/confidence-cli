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
import { useIsShort } from '@ui/tui/hooks/useIsShort.js';
import { doneOptions } from './actions.js';
import { useScreenDescription } from './useScreenDescription.js';
import { useSkippedOnboarding } from './useSkippedOnboarding.js';
import { useIdeIdName } from './useIdeIdName.js';

const MAX_SHOWN_CHANGES = 5;

export function DoneScreen() {
  const { exit } = useApp();
  const { reportFile, codeChanges, projectDir } = useSession();

  const skipped = useSkippedOnboarding();
  const ideName = useIdeIdName();
  const description = useScreenDescription();

  const isShort = useIsShort();
  const narrow = useIsNarrow();
  const align = narrow ? HAlign.Left : HAlign.Center;

  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="space-between">
      <Box flexDirection="column" alignItems={align} flexGrow={1} justifyContent={VAlign.Center}>
        <Box marginBottom={1}>
          <Text color={skipped ? Colors.muted : Colors.success} bold>
            {skipped ? Icons.diamond : Icons.check}{' '}
            {skipped ? 'Onboarding skipped' : 'Confidence is ready!'}
          </Text>
        </Box>

        {!isShort && (
          <Box marginBottom={1}>
            <Text color={Colors.muted}>{description}</Text>
          </Box>
        )}

        {!skipped && !isShort && (
          <>
            <Box alignItems={align}>
              <Text bold>What we have set up:</Text>
            </Box>
            <Box flexDirection="column" marginBottom={1}>
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
          </>
        )}

        <Box flexDirection="column" marginTop={1}>
          {reportFile && (
            <Text color={Colors.muted}>
              {'  Full report: '}
              <TerminalLink url={`file://${join(projectDir, reportFile)}`}>
                {reportFile}
              </TerminalLink>
            </Text>
          )}
          <Text color={Colors.muted}>
            {'Documentation: '}
            <Text color={Colors.primary}>{CONFIDENCE_DOCS_URL}</Text>
          </Text>
          <Text color={Colors.muted}>
            {'    Dashboard: '}
            <Text color={Colors.primary}>{CONFIDENCE_DASHBOARD_URL}</Text>
          </Text>
        </Box>
      </Box>

      <PromptPanel
        mode="select"
        status="What's next?"
        options={doneOptions(ideName)}
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
